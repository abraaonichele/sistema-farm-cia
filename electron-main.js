const { app, BrowserWindow, dialog, ipcMain, shell } = require("electron");
const { autoUpdater } = require("electron-updater");
const fs = require("fs/promises");
const path = require("path");

let availableUpdateVersion = "";
let downloadedUpdateReady = false;

autoUpdater.autoDownload = false;
autoUpdater.autoInstallOnAppQuit = false;
autoUpdater.logger = console;

autoUpdater.on("download-progress", (progress) => {
  for (const window of BrowserWindow.getAllWindows()) {
    window.webContents.send("app-update:download-progress", {
      percent: Math.round(progress.percent),
    });
  }
});

autoUpdater.on("update-downloaded", () => {
  downloadedUpdateReady = true;
});

function registerAppUpdateHandlers() {
  ipcMain.handle("app-update:check", async () => {
    if (process.platform !== "win32" || !app.isPackaged) {
      return {
        status: "unsupported",
        currentVersion: app.getVersion(),
      };
    }

    const result = await autoUpdater.checkForUpdates();
    availableUpdateVersion = result?.isUpdateAvailable ? result.updateInfo.version : "";
    downloadedUpdateReady = false;
    return {
      status: "checked",
      updateAvailable: Boolean(availableUpdateVersion),
      currentVersion: app.getVersion(),
      version: availableUpdateVersion || null,
    };
  });

  ipcMain.handle("app-update:download", async () => {
    if (!availableUpdateVersion) {
      throw new Error("Verifique se há uma atualização antes de iniciar o download.");
    }
    await autoUpdater.downloadUpdate();
    return { downloaded: true };
  });

  ipcMain.handle("app-update:install", () => {
    if (!downloadedUpdateReady) {
      throw new Error("A atualização ainda não terminou de baixar.");
    }
    autoUpdater.quitAndInstall(false, true);
  });
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
  registerAppUpdateHandlers();
  createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});
