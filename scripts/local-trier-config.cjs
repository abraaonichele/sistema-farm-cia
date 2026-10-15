const os = require("os");
const path = require("path");

function getLocalTrierDataDirectory() {
  if (process.env.APPDATA) {
    return path.join(process.env.APPDATA, "Atendimento Inj Farmacia");
  }
  if (process.platform === "darwin") {
    return path.join(os.homedir(), "Library", "Application Support", "Atendimento Inj Farmacia");
  }
  return path.join(os.homedir(), ".config", "atendimento-inj-farmacia");
}

module.exports = {
  getLocalTrierCachePath: () => path.join(getLocalTrierDataDirectory(), "trier-products-cache.json"),
  getLocalTrierConfigPath: () => path.join(getLocalTrierDataDirectory(), "trier-browser-config.json"),
  getLocalTrierDataDirectory,
};
