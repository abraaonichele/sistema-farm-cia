const { app, BrowserWindow, dialog, ipcMain, safeStorage, shell } = require("electron");
const fs = require("fs/promises");
const path = require("path");
const { fetchTrierProducts, normalizeTrierBaseUrl, TRIER_DEFAULT_BASE_URL } = require("./trier-products.cjs");

let trierProductsCache = null;
let trierProductsCacheAt = 0;
let trierProductsFetchPromise = null;
let trierSyncInterval = null;
let trierSyncInProgress = false;

const TRIER_CACHE_DURATION_MS = 5 * 60 * 1000;

function getTrierConfigPath() {
  return path.join(app.getPath("userData"), "trier-integration.json");
}

function getBundledTrierConfigPath() {
  return path.join(process.resourcesPath, "trier-bootstrap.json");
}

async function readBundledTrierConfig() {
  try {
    const bundled = JSON.parse(await fs.readFile(getBundledTrierConfigPath(), "utf8"));
    return {
      baseUrl: String(bundled?.baseUrl || "").trim(),
      token: String(bundled?.token || "").trim(),
    };
  } catch (error) {
    if (error?.code !== "ENOENT") console.warn("Não foi possível ler o provisionamento da Trier.", error);
    return { baseUrl: "", token: "" };
  }
}

async function writeEncryptedTrierConfig(baseUrl, token) {
  if (!safeStorage.isEncryptionAvailable()) {
    throw new Error("A criptografia segura do sistema não está disponível neste computador.");
  }
  const config = {
    baseUrl: normalizeTrierBaseUrl(baseUrl),
    encryptedToken: safeStorage.encryptString(token).toString("base64"),
    updatedAt: new Date().toISOString(),
  };
  await fs.mkdir(path.dirname(getTrierConfigPath()), { recursive: true });
  await fs.writeFile(getTrierConfigPath(), `${JSON.stringify(config, null, 2)}\n`, { mode: 0o600 });
  return config;
}

async function readTrierConfig() {
  let stored = {};
  try {
    stored = JSON.parse(await fs.readFile(getTrierConfigPath(), "utf8"));
  } catch (error) {
    if (error?.code !== "ENOENT") console.warn("Não foi possível ler a configuração da Trier.", error);
  }

  const bundled = await readBundledTrierConfig();
  const environmentToken = String(process.env.TRIER_API_TOKEN || "").trim();
  let storedToken = "";
  if (stored.encryptedToken && safeStorage.isEncryptionAvailable()) {
    try {
      storedToken = safeStorage.decryptString(Buffer.from(stored.encryptedToken, "base64")).trim();
    } catch (error) {
      console.warn("Não foi possível descriptografar o token da Trier.", error);
    }
  }

  const storedBaseUrl = stored.baseUrl && stored.baseUrl !== TRIER_DEFAULT_BASE_URL
    ? stored.baseUrl
    : bundled.baseUrl || stored.baseUrl;
  const baseUrl = normalizeTrierBaseUrl(
    process.env.TRIER_API_BASE_URL || storedBaseUrl || TRIER_DEFAULT_BASE_URL,
  );
  const token = environmentToken || storedToken || bundled.token;

  if (!environmentToken && !storedToken && bundled.token) {
    try {
      await writeEncryptedTrierConfig(baseUrl, bundled.token);
    } catch (error) {
      console.warn("Não foi possível proteger o token provisionado da Trier.", error);
    }
  }

  return {
    baseUrl,
    token,
  };
}

async function saveTrierConfig({ baseUrl, token }) {
  const current = await readTrierConfig();
  const nextToken = String(token || "").trim() || current.token;
  if (!nextToken) throw new Error("Informe o token de integração fornecido pela Trier.");
  const config = await writeEncryptedTrierConfig(baseUrl || current.baseUrl, nextToken);
  trierProductsCache = null;
  trierProductsCacheAt = 0;
  return { baseUrl: config.baseUrl, configured: true };
}

async function fetchAllTrierProducts(forceRefresh = false) {
  if (!forceRefresh && trierProductsCache && Date.now() - trierProductsCacheAt < TRIER_CACHE_DURATION_MS) {
    return { products: trierProductsCache, cached: true, syncedAt: new Date(trierProductsCacheAt).toISOString() };
  }
  if (trierProductsFetchPromise) return trierProductsFetchPromise;

  trierProductsFetchPromise = (async () => {
    const config = await readTrierConfig();
    if (!config.token) {
      const error = new Error("O token da Trier não está disponível para a sincronização automática.");
      error.code = "TRIER_NOT_CONFIGURED";
      throw error;
    }

    const products = await fetchTrierProducts(config);
    trierProductsCache = products;
    trierProductsCacheAt = Date.now();
    return { products, cached: false, syncedAt: new Date(trierProductsCacheAt).toISOString() };
  })();

  try {
    return await trierProductsFetchPromise;
  } finally {
    trierProductsFetchPromise = null;
  }
}

function registerTrierHandlers() {
  ipcMain.handle("trier:get-config", async () => {
    const config = await readTrierConfig();
    return { baseUrl: config.baseUrl, configured: Boolean(config.token) };
  });
  ipcMain.handle("trier:save-config", async (_event, payload) => saveTrierConfig(payload || {}));
  ipcMain.handle("trier:get-products", async (_event, payload) => fetchAllTrierProducts(Boolean(payload?.forceRefresh)));
}

function broadcastTrierEvent(channel, payload) {
  for (const window of BrowserWindow.getAllWindows()) {
    if (!window.isDestroyed()) window.webContents.send(channel, payload);
  }
}

async function syncTrierProductsAutomatically() {
  if (trierSyncInProgress) return;
  trierSyncInProgress = true;
  try {
    const result = await fetchAllTrierProducts(true);
    broadcastTrierEvent("trier:products-updated", result);
  } catch (error) {
    console.error("Erro na sincronização automática da Trier:", error);
    broadcastTrierEvent("trier:sync-error", {
      message: error?.message || "Não foi possível atualizar os produtos da Trier.",
      occurredAt: new Date().toISOString(),
    });
  } finally {
    trierSyncInProgress = false;
  }
}

function startTrierAutomaticSync() {
  if (trierSyncInterval) clearInterval(trierSyncInterval);
  setTimeout(syncTrierProductsAutomatically, 1_500);
  trierSyncInterval = setInterval(syncTrierProductsAutomatically, TRIER_CACHE_DURATION_MS);
}

function validateOfferPrintRequest(payload) {
  if (!payload || typeof payload.html !== "string" || payload.html.length > 25_000_000) {
    throw new Error("Não foi possível preparar a folha de oferta para impressão.");
  }
  for (const dimension of [payload.widthMm, payload.heightMm]) {
    if (!Number.isFinite(dimension) || dimension < 20 || dimension > 500) {
      throw new Error("O tamanho da folha de oferta é inválido.");
    }
  }
}

async function createOfferPrintWindow(html) {
  const templateStyles = await fs.readFile(path.join(__dirname, "offer-template.css"), "utf8");
  let documentHtml = html.replace(
    /<link\b(?=[^>]*offer-template\.css)[^>]*>/i,
    `<style>${templateStyles}</style>`,
  );
  const backgroundMatch = documentHtml.match(/src=["'](?:\.\/)?assets\/modelo-panfleto-oferta-(square|story)\.png["']/);
  if (backgroundMatch) {
    const imageName = `modelo-panfleto-oferta-${backgroundMatch[1]}.png`;
    const imageData = await fs.readFile(path.join(__dirname, "assets", imageName));
    const dataUrl = `data:image/png;base64,${imageData.toString("base64")}`;
    documentHtml = documentHtml.replace(backgroundMatch[0], `src="${dataUrl}"`);
  }

  const printWindow = new BrowserWindow({
    show: false,
    width: 1000,
    height: 1400,
    backgroundColor: "#ffffff",
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });
  try {
    await printWindow.loadURL(`data:text/html;charset=utf-8;base64,${Buffer.from(documentHtml).toString("base64")}`);
    await printWindow.webContents.executeJavaScript(`Promise.all([
      ...Array.from(document.images, (image) => image.decode()),
      document.fonts.ready,
    ])`);
    return printWindow;
  } catch (error) {
    if (!printWindow.isDestroyed()) printWindow.close();
    throw error;
  }
}

function registerOfferPrintingHandlers() {
  ipcMain.handle("offer:save-pdf", async (event, payload) => {
    validateOfferPrintRequest(payload);
    const owner = BrowserWindow.fromWebContents(event.sender);
    const result = await dialog.showSaveDialog(owner, {
      title: "Salvar folha de oferta em PDF",
      defaultPath: path.join(app.getPath("documents"), "Folha de oferta.pdf"),
      filters: [{ name: "PDF", extensions: ["pdf"] }],
    });
    if (result.canceled || !result.filePath) return { canceled: true };

    const printWindow = await createOfferPrintWindow(payload.html);
    try {
      const pdf = await printWindow.webContents.printToPDF({
        pageSize: {
          width: Math.round(payload.widthMm * 1000),
          height: Math.round(payload.heightMm * 1000),
        },
        margins: { top: 0, bottom: 0, left: 0, right: 0 },
        printBackground: true,
        preferCSSPageSize: true,
        pageRanges: "1",
      });
      await fs.writeFile(result.filePath, pdf);
      return { canceled: false, filePath: result.filePath };
    } finally {
      if (!printWindow.isDestroyed()) printWindow.close();
    }
  });

  ipcMain.handle("offer:print", async (event, payload) => {
    validateOfferPrintRequest(payload);
    const printWindow = await createOfferPrintWindow(payload.html);
    try {
      const printed = await new Promise((resolve, reject) => {
        printWindow.webContents.print({
          printBackground: true,
          margins: { marginType: "none" },
          pageSize: {
            width: Math.round(payload.widthMm * 1000),
            height: Math.round(payload.heightMm * 1000),
          },
        }, (success, failureReason) => {
          if (!success) reject(new Error(failureReason || "Não foi possível imprimir a folha de oferta."));
          else resolve(success);
        });
      });
      return { printed };
    } finally {
      if (!printWindow.isDestroyed()) printWindow.close();
    }
  });
}

function isInternalPopup(url) {
  return url.startsWith("about:") || url.startsWith("data:text/html");
}

function isExternalUrl(url) {
  return /^https?:\/\//i.test(url) || /^mailto:/i.test(url);
}

function createWindow() {
  const window = new BrowserWindow({
    width: 1440,
    height: 960,
    minWidth: 1200,
    minHeight: 760,
    autoHideMenuBar: true,
    title: "Atendimento Inj Farmacia",
    backgroundColor: "#eef5fb",
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
      preload: path.join(__dirname, "preload.js"),
    },
  });

  window.maximize();
  window.loadFile(path.join(__dirname, "index.html"));

  window.webContents.setWindowOpenHandler(({ url }) => {
    if (isInternalPopup(url)) {
      return {
        action: "allow",
        overrideBrowserWindowOptions: {
          width: 980,
          height: 1280,
          autoHideMenuBar: true,
          show: true,
          title: "Impressão",
          backgroundColor: "#ffffff",
          webPreferences: {
            contextIsolation: true,
            nodeIntegration: false,
            sandbox: false,
          },
        },
      };
    }

    if (isExternalUrl(url)) {
      shell.openExternal(url);
    }
    return { action: "deny" };
  });
}

app.whenReady().then(() => {
  registerOfferPrintingHandlers();
  registerTrierHandlers();
  createWindow();
  startTrierAutomaticSync();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on("before-quit", () => {
  if (trierSyncInterval) clearInterval(trierSyncInterval);
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});
