const fs = require("fs/promises");
const path = require("path");

module.exports = async function provisionTrier(context) {
  const token = String(process.env.TRIER_BUNDLED_TOKEN || "").trim();
  const resourcesDirectory = context.electronPlatformName === "darwin"
    ? path.join(context.appOutDir, `${context.packager.appInfo.productFilename}.app`, "Contents", "Resources")
    : path.join(context.appOutDir, "resources");
  const bootstrapPath = path.join(resourcesDirectory, "trier-bootstrap.json");

  if (!token) {
    await fs.rm(bootstrapPath, { force: true });
    return;
  }

  const baseUrl = String(process.env.TRIER_BUNDLED_BASE_URL || "http://localhost:4647/sgfpod1")
    .trim()
    .replace(/\/+$/, "");

  await fs.writeFile(
    bootstrapPath,
    `${JSON.stringify({ baseUrl, token })}\n`,
    { mode: 0o600 },
  );
};
