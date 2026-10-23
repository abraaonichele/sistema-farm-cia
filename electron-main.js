const { app, BrowserWindow, dialog, ipcMain, safeStorage, shell } = require("electron");
const http = require("http");
const fs = require("fs/promises");
const path = require("path");
const { spawn } = require("child_process");
const {
  fetchTrierProducts,
  loadTrierProductCache,
  normalizeTrierBaseUrl,
  saveTrierProductCache,
  TRIER_DEFAULT_BASE_URL,
} = require("./trier-products.cjs");
const { sendTrierEcommerceSale } = require("./trier-sales.cjs");

let trierProductsCache = null;
let trierProductsCacheAt = 0;
let trierProductsCacheBaseUrl = "";
let trierProductsCacheLoaded = false;
let trierProductsCacheLoadPromise = null;
let trierProductsFetchPromise = null;
let trierSyncInterval = null;
let trierSyncInProgress = false;
let trierLastSyncError = "";

const TRIER_CACHE_DURATION_MS = 5 * 60 * 1000;
const TRIER_BROWSER_SERVICE_ARGUMENT = "--trier-browser-service";
const TRIER_BROWSER_SERVICE_PORT = 43187;
const LEGACY_LOCAL_TRIER_BASE_URL = "http://localhost:4647/sgfpod1";
const PREVIOUS_UNREACHABLE_TRIER_BASE_URL = "http://192.168.1.25:4647/sgfpod1";
let trierBrowserServer = null;

function getTrierConfigPath() {
  return path.join(app.getPath("userData"), "trier-integration.json");
}

function getTrierProductsCachePath() {
  return path.join(app.getPath("userData"), "trier-products-cache.json");
}

async function writeEncryptedTrierConfig(baseUrl, token) {
  const normalizedBaseUrl = normalizeTrierBaseUrl(baseUrl);
  if (String(token).trim().length > 8192) {
    throw new Error("O token da Trier excede o tamanho permitido.");
  }
  if (!safeStorage.isEncryptionAvailable()) {
    throw new Error("A criptografia segura do sistema não está disponível neste computador.");
  }
  const config = {
    baseUrl: normalizedBaseUrl,
    encryptedToken: safeStorage.encryptString(token).toString("base64"),
    updatedAt: new Date().toISOString(),
  };
  await fs.mkdir(path.dirname(getTrierConfigPath()), { recursive: true });
  const configPath = getTrierConfigPath();
  const temporaryPath = `${configPath}.${process.pid}.tmp`;
  try {
    await fs.writeFile(temporaryPath, `${JSON.stringify(config, null, 2)}\n`, { mode: 0o600 });
    await fs.rename(temporaryPath, configPath);
    if (process.platform !== "win32") await fs.chmod(configPath, 0o600);
  } catch (error) {
    try {
      await fs.rm(temporaryPath, { force: true });
    } catch (cleanupError) {
      console.error("Não foi possível limpar a configuração temporária da Trier:", cleanupError);
    }
    throw error;
  }
  return config;
}

async function readTrierConfig() {
  let stored = {};
  try {
    stored = JSON.parse(await fs.readFile(getTrierConfigPath(), "utf8"));
  } catch (error) {
    if (error?.code !== "ENOENT") console.warn("Não foi possível ler a configuração da Trier.", error);
  }

  let storedToken = "";
  if (stored.encryptedToken && safeStorage.isEncryptionAvailable()) {
    try {
      storedToken = safeStorage.decryptString(Buffer.from(stored.encryptedToken, "base64")).trim();
    } catch (error) {
      console.warn("Não foi possível descriptografar o token da Trier.", error);
    }
  }

  const isLegacyBaseUrl = [LEGACY_LOCAL_TRIER_BASE_URL, PREVIOUS_UNREACHABLE_TRIER_BASE_URL]
    .includes(stored.baseUrl);
  const baseUrl = normalizeTrierBaseUrl(
    process.env.TRIER_API_BASE_URL
      || (!isLegacyBaseUrl && stored.baseUrl)
      || TRIER_DEFAULT_BASE_URL,
  );
  const token = storedToken;

  if (isLegacyBaseUrl && storedToken) {
    try {
      await writeEncryptedTrierConfig(baseUrl, storedToken);
    } catch (error) {
      console.error("Não foi possível atualizar o endereço Trier salvo neste computador:", error);
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
  trierProductsCacheBaseUrl = "";
  trierProductsCacheLoaded = false;
  trierProductsCacheLoadPromise = null;
  trierLastSyncError = "";
  return { baseUrl: config.baseUrl, configured: true };
}

async function loadTrierProductsCache(baseUrl) {
  if (trierProductsCacheLoaded && trierProductsCacheBaseUrl === baseUrl) return;
  if (trierProductsCacheLoadPromise) return trierProductsCacheLoadPromise;
  trierProductsCache = null;
  trierProductsCacheAt = 0;
  trierProductsCacheBaseUrl = baseUrl;
  trierProductsCacheLoadPromise = (async () => {
    try {
      const cache = await loadTrierProductCache(getTrierProductsCachePath(), baseUrl);
      if (cache) {
        trierProductsCache = cache.products;
        trierProductsCacheAt = Date.parse(cache.syncedAt);
      }
    } catch (error) {
      console.error("Não foi possível carregar o cache salvo da Trier:", error);
    } finally {
      trierProductsCacheLoaded = true;
    }
  })();
  try {
    await trierProductsCacheLoadPromise;
  } finally {
    trierProductsCacheLoadPromise = null;
  }
}

async function fetchAllTrierProducts(forceRefresh = false) {
  const config = await readTrierConfig();
  await loadTrierProductsCache(config.baseUrl);
  if (!forceRefresh && trierProductsCache) {
    const cachedResult = {
      products: trierProductsCache,
      cached: true,
      syncedAt: new Date(trierProductsCacheAt).toISOString(),
      refreshing: Date.now() - trierProductsCacheAt >= TRIER_CACHE_DURATION_MS,
      syncError: trierLastSyncError,
    };
    if (Date.now() - trierProductsCacheAt >= TRIER_CACHE_DURATION_MS) {
      void fetchAllTrierProducts(true).catch((error) => {
        console.error("Não foi possível atualizar o cache Trier em segundo plano:", error);
      });
    }
    return cachedResult;
  }
  if (trierProductsFetchPromise) return trierProductsFetchPromise;

  trierProductsFetchPromise = (async () => {
    if (!config.token) {
      const error = new Error("O token da Trier não está disponível para a sincronização automática.");
      error.code = "TRIER_NOT_CONFIGURED";
      throw error;
    }

    const products = await fetchTrierProducts(config);
    const syncedAt = new Date().toISOString();
    trierLastSyncError = "";
    trierProductsCache = products;
    trierProductsCacheAt = Date.parse(syncedAt);
    trierProductsCacheBaseUrl = config.baseUrl;

    let cacheError = "";
    try {
      await saveTrierProductCache(getTrierProductsCachePath(), {
        products,
        syncedAt,
        baseUrl: config.baseUrl,
      });
    } catch (error) {
      cacheError = `Produtos carregados, mas não foi possível salvar o catálogo neste computador: ${error.message}`;
      console.error("Não foi possível salvar o cache da Trier:", error);
    }

    return { products, cached: false, syncedAt, cacheError };
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
  ipcMain.handle("trier:send-sale", async (_event, payload) => {
    const config = await readTrierConfig();
    return sendTrierEcommerceSale(config, payload || {});
  });
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
    trierLastSyncError = error?.message || "Não foi possível atualizar o catálogo da Trier.";
    console.error("Erro na sincronização automática da Trier:", error);
    broadcastTrierEvent("trier:sync-error", {
      message: trierLastSyncError,
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

function sendTrierBrowserResponse(response, statusCode, body) {
  response.writeHead(statusCode, {
    "Access-Control-Allow-Origin": "null",
    "Cache-Control": "no-store",
    "Content-Type": "application/json; charset=utf-8",
    "Vary": "Origin",
    "X-Content-Type-Options": "nosniff",
  });
  response.end(JSON.stringify(body));
}

function startTrierBrowserService() {
  trierBrowserServer = http.createServer(async (request, response) => {
    const localHosts = [
      `127.0.0.1:${TRIER_BROWSER_SERVICE_PORT}`,
      `localhost:${TRIER_BROWSER_SERVICE_PORT}`,
    ];
    if (!localHosts.includes(request.headers.host) || request.headers.origin !== "null") {
      sendTrierBrowserResponse(response, 403, { error: "Acesso local não autorizado." });
      return;
    }

    if (request.method === "OPTIONS") {
      response.writeHead(204, {
        "Access-Control-Allow-Origin": "null",
        "Access-Control-Allow-Methods": "GET, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
        "Access-Control-Max-Age": "600",
        "Vary": "Origin",
      });
      response.end();
      return;
    }

    const route = new URL(request.url || "/", `http://127.0.0.1:${TRIER_BROWSER_SERVICE_PORT}`).pathname;
    if (request.method !== "GET" || !["/trier/status", "/trier/products"].includes(route)) {
      sendTrierBrowserResponse(response, 404, { error: "Rota local não encontrada." });
      return;
    }

    try {
      if (route === "/trier/status") {
        const config = await readTrierConfig();
        sendTrierBrowserResponse(response, 200, {
          baseUrl: config.baseUrl,
          configured: Boolean(config.token),
        });
        return;
      }

      const result = await fetchAllTrierProducts(false);
      sendTrierBrowserResponse(response, 200, result);
    } catch (error) {
      sendTrierBrowserResponse(response, 503, {
        error: error?.message || "Não foi possível carregar os produtos Trier.",
      });
    }
  });

  trierBrowserServer.on("error", (error) => {
    console.error("Não foi possível iniciar o serviço local do catálogo Trier:", error);
  });
  trierBrowserServer.listen(TRIER_BROWSER_SERVICE_PORT, "127.0.0.1");
}

function startTrierBrowserServiceProcess() {
  if (process.platform !== "win32" || !app.isPackaged) return;
  try {
    app.setLoginItemSettings({
      openAtLogin: true,
      args: [TRIER_BROWSER_SERVICE_ARGUMENT],
      name: "Atendimento Inj Farmacia",
    });
    const serviceArguments = app.isPackaged
      ? [TRIER_BROWSER_SERVICE_ARGUMENT]
      : [app.getAppPath(), TRIER_BROWSER_SERVICE_ARGUMENT];
    const service = spawn(process.execPath, serviceArguments, {
      detached: true,
      stdio: "ignore",
      windowsHide: true,
    });
    service.on("error", (error) => {
      console.error("Não foi possível iniciar o serviço Trier para o navegador:", error);
    });
    service.unref();
  } catch (error) {
    console.error("Não foi possível configurar o serviço Trier para iniciar com o Windows:", error);
  }
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

if (process.argv.includes(TRIER_BROWSER_SERVICE_ARGUMENT)) {
  if (app.requestSingleInstanceLock()) {
    app.whenReady().then(() => {
      startTrierBrowserService();
      startTrierAutomaticSync();
    });
  } else {
    app.quit();
  }
} else {
  app.whenReady().then(() => {
    registerOfferPrintingHandlers();
    registerTrierHandlers();
    createWindow();
    startTrierAutomaticSync();
    startTrierBrowserServiceProcess();

    app.on("activate", () => {
      if (BrowserWindow.getAllWindows().length === 0) {
        createWindow();
      }
    });
  });
}

app.on("before-quit", () => {
  if (trierSyncInterval) clearInterval(trierSyncInterval);
  if (trierBrowserServer) trierBrowserServer.close();
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});
