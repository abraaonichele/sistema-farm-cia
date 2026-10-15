const fs = require("fs/promises");
const path = require("path");
const { normalizeTrierBaseUrl, TRIER_DEFAULT_BASE_URL } = require("../trier-products.cjs");

module.exports = async function provisionTrier(context) {
  const token = String(process.env.TRIER_BUNDLED_TOKEN || "").trim();
  const resourcesDirectory = context.electronPlatformName === "darwin"
    ? path.join(context.appOutDir, `${context.packager.appInfo.productFilename}.app`, "Contents", "Resources")
    : path.join(context.appOutDir, "resources");
  const bootstrapPath = path.join(resourcesDirectory, "trier-bootstrap.json");
  const baseUrl = normalizeTrierBaseUrl(process.env.TRIER_BUNDLED_BASE_URL || TRIER_DEFAULT_BASE_URL);

  await fs.writeFile(
    bootstrapPath,
    `${JSON.stringify({ baseUrl, ...(token ? { token } : {}) })}\n`,
    { mode: 0o600 },
  );
};
