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

contextBridge.exposeInMainWorld("desktopTrier", {
  getConfig: () => ipcRenderer.invoke("trier:get-config"),
  saveConfig: (config) => ipcRenderer.invoke("trier:save-config", config),
  getProducts: (forceRefresh = false) => ipcRenderer.invoke("trier:get-products", { forceRefresh }),
  sendSale: (sale) => ipcRenderer.invoke("trier:send-sale", sale),
  onProductsUpdated: (callback) => {
    if (typeof callback !== "function") throw new TypeError("O callback da Trier precisa ser uma função.");
    const listener = (_event, result) => callback(result);
    ipcRenderer.on("trier:products-updated", listener);
    return () => ipcRenderer.removeListener("trier:products-updated", listener);
  },
  onSyncError: (callback) => {
    if (typeof callback !== "function") throw new TypeError("O callback da Trier precisa ser uma função.");
    const listener = (_event, result) => callback(result);
    ipcRenderer.on("trier:sync-error", listener);
    return () => ipcRenderer.removeListener("trier:sync-error", listener);
  },
});

contextBridge.exposeInMainWorld("desktopUpdater", {
  check: () => ipcRenderer.invoke("updates:check"),
  onStatus: (callback) => {
    if (typeof callback !== "function") throw new TypeError("O callback de atualização precisa ser uma função.");
    const listener = (_event, status) => callback(status);
    ipcRenderer.on("updates:status", listener);
    return () => ipcRenderer.removeListener("updates:status", listener);
  },
});

