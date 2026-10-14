const { contextBridge, ipcRenderer } = require("electron");
const fs = require("fs/promises");
const path = require("path");
const zlib = require("zlib");
const { promisify } = require("util");

const gunzip = promisify(zlib.gunzip);

async function readCompressedJson(fileName) {
  const source = await fs.readFile(path.join(__dirname, "bulas-medicamentos", fileName));
  return (await gunzip(source)).toString("utf8");
}

contextBridge.exposeInMainWorld("desktopMedicineData", {
  load: async () => {
    const [raia, xlsx, aliases] = await Promise.all([
      readCompressedJson("medicine-library-raia.json.gz"),
      readCompressedJson("medicine-library-xlsx.json.gz"),
      readCompressedJson("ean-medicine-aliases.json.gz"),
    ]);
    return { raia, xlsx, aliases };
  },
});

contextBridge.exposeInMainWorld("desktopOfferPrinting", {
  savePdf: (html, widthMm, heightMm) => ipcRenderer.invoke("offer:save-pdf", { html, widthMm, heightMm }),
  print: (html, widthMm, heightMm) => ipcRenderer.invoke("offer:print", { html, widthMm, heightMm }),
});

contextBridge.exposeInMainWorld("desktopAppUpdates", {
  checkForUpdates: () => ipcRenderer.invoke("app-update:check"),
  downloadUpdate: () => ipcRenderer.invoke("app-update:download"),
  installUpdate: () => ipcRenderer.invoke("app-update:install"),
  onDownloadProgress: (callback) => {
    if (typeof callback !== "function") {
      throw new TypeError("O callback de progresso da atualização precisa ser uma função.");
    }
    const listener = (_event, progress) => callback(progress);
    ipcRenderer.on("app-update:download-progress", listener);
    return () => ipcRenderer.removeListener("app-update:download-progress", listener);
  },
});
