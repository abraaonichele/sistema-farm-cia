const fs = require("fs/promises");
const fsStream = require("fs");
const http = require("http");
const path = require("path");
const {
  getLocalTrierCachePath,
  getLocalTrierConfigPath,
  getLocalTrierDataDirectory,
} = require("./local-trier-config.cjs");
const { fetchTrierProducts, normalizeTrierBaseUrl, TRIER_DEFAULT_BASE_URL } = require("../trier-products.cjs");

const PROJECT_ROOT = path.resolve(__dirname, "..");
const HOST = "127.0.0.1";
const PORT = Number(process.env.TRIER_LOCAL_PORT || 4173);
const SYNC_INTERVAL_MS = 5 * 60 * 1000;
const MAX_CACHE_BYTES = 100 * 1024 * 1024;
const MIME_TYPES = {
  ".css": "text/css; charset=utf-8",
  ".gif": "image/gif",
  ".html": "text/html; charset=utf-8",
  ".ico": "image/x-icon",
  ".jpeg": "image/jpeg",
  ".jpg": "image/jpeg",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".webp": "image/webp",
};
const ALLOWED_ROOT_FILES = new Set(["index.html", "main.js", "styles.css", "offer-template.css"]);
const eventClients = new Set();

let products = [];
let syncedAt = "";
let syncError = "";
let syncInProgress = false;

function localConfigFromEnvironment() {
  const token = String(process.env.TRIER_API_TOKEN || "").trim();
  if (!token) return null;
  return {
    baseUrl: normalizeTrierBaseUrl(process.env.TRIER_API_BASE_URL || TRIER_DEFAULT_BASE_URL),
    token,
  };
}

async function readLocalTrierConfig() {
  const environmentConfig = localConfigFromEnvironment();
  if (environmentConfig) return environmentConfig;
  try {
    const saved = JSON.parse(await fs.readFile(getLocalTrierConfigPath(), "utf8"));
    const token = String(saved?.token || "").trim();
    if (!token) throw new Error("A configuração local da Trier está sem token.");
    return {
      baseUrl: normalizeTrierBaseUrl(saved.baseUrl),
      token,
    };
  } catch (error) {
    if (error?.code === "ENOENT") {
      const missingConfig = new Error("Configure o acesso Trier uma vez com `npm run browser:local:setup`.");
      missingConfig.code = "TRIER_NOT_CONFIGURED";
      throw missingConfig;
    }
    throw error;
  }
}

function broadcastSyncEvent(type) {
  const payload = JSON.stringify({ type, syncedAt, count: products.length, error: syncError });
  for (const response of eventClients) response.write(`event: trier-sync\ndata: ${payload}\n\n`);
}

async function loadProductCache() {
  try {
    const info = await fs.stat(getLocalTrierCachePath());
    if (info.size > MAX_CACHE_BYTES) throw new Error("O cache local de produtos excede o limite permitido.");
    const cached = JSON.parse(await fs.readFile(getLocalTrierCachePath(), "utf8"));
    if (!Array.isArray(cached.products) || typeof cached.syncedAt !== "string") {
      throw new Error("O cache local de produtos está inválido.");
    }
    products = cached.products;
    syncedAt = cached.syncedAt;
  } catch (error) {
    if (error?.code !== "ENOENT") {
      console.error("Não foi possível carregar o cache local da Trier:", error.message);
    }
  }
}

async function saveProductCache() {
  const cachePath = getLocalTrierCachePath();
  const directory = getLocalTrierDataDirectory();
  await fs.mkdir(directory, { recursive: true, mode: 0o700 });
  const temporaryPath = `${cachePath}.${process.pid}.tmp`;
  await fs.writeFile(temporaryPath, `${JSON.stringify({ products, syncedAt })}\n`, { mode: 0o600 });
  await fs.rename(temporaryPath, cachePath);
  if (process.platform !== "win32") await fs.chmod(cachePath, 0o600);
}

async function syncProducts() {
  if (syncInProgress) return;
  syncInProgress = true;
  try {
    const config = await readLocalTrierConfig();
    const freshProducts = await fetchTrierProducts(config);
    const freshSyncedAt = new Date().toISOString();
    const serializedCache = JSON.stringify({ products: freshProducts, syncedAt: freshSyncedAt });
    if (Buffer.byteLength(serializedCache, "utf8") > MAX_CACHE_BYTES) {
      throw new Error("O catálogo sincronizado excede o limite permitido para o cache local.");
    }
    products = freshProducts;
    syncedAt = freshSyncedAt;
    syncError = "";
    await saveProductCache();
    broadcastSyncEvent("updated");
  } catch (error) {
    syncError = error?.message || "Não foi possível sincronizar os produtos da Trier.";
    console.error(`Erro na sincronização Trier: ${syncError}`);
    broadcastSyncEvent("error");
  } finally {
    syncInProgress = false;
  }
}

function isAllowedOrigin(request) {
  const host = request.headers.host;
  if (host !== `localhost:${PORT}` && host !== `127.0.0.1:${PORT}`) return false;
  const origin = request.headers.origin;
  if (!origin) return true;
  try {
    const parsed = new URL(origin);
    return parsed.protocol === "http:"
      && ["localhost", "127.0.0.1"].includes(parsed.hostname)
      && parsed.port === String(PORT);
  } catch {
    return false;
  }
}

function isAllowedStaticPath(relativePath) {
  if (!relativePath || relativePath.split("/").some((part) => !part || part === ".." || part.startsWith("."))) return false;
  if (ALLOWED_ROOT_FILES.has(relativePath)) return true;
  if (/^assets\/[A-Za-z0-9._/-]+$/.test(relativePath)) return true;
  if (/^public-offers\/[A-Za-z0-9._/-]+$/.test(relativePath)) return true;
  return /^bulas-medicamentos\/[A-Za-z0-9._/-]+\.generated\.js$/.test(relativePath);
}

async function serveStaticFile(request, response, pathname) {
  let relativePath;
  try {
    relativePath = decodeURIComponent(pathname === "/" ? "/index.html" : pathname).slice(1);
  } catch {
    response.writeHead(400).end("Invalid path");
    return;
  }
  if (!isAllowedStaticPath(relativePath)) {
    response.writeHead(404).end("Not found");
    return;
  }
  const filePath = path.resolve(PROJECT_ROOT, relativePath);
  if (!filePath.startsWith(`${PROJECT_ROOT}${path.sep}`)) {
    response.writeHead(404).end("Not found");
    return;
  }
  try {
    const info = await fs.lstat(filePath);
    if (!info.isFile() || info.isSymbolicLink()) {
      response.writeHead(404).end("Not found");
      return;
    }
    response.writeHead(200, {
      "Cache-Control": "no-cache",
      "Content-Type": MIME_TYPES[path.extname(filePath).toLowerCase()] || "application/octet-stream",
      "Content-Length": info.size,
      "X-Content-Type-Options": "nosniff",
      "Referrer-Policy": "no-referrer",
    });
    if (request.method === "HEAD") {
      response.end();
      return;
    }
    await new Promise((resolve, reject) => {
      const stream = fsStream.createReadStream(filePath);
      stream.on("error", reject);
      response.on("close", resolve);
      stream.on("end", resolve);
      stream.pipe(response);
    });
  } catch (error) {
    if (error?.code === "ENOENT") response.writeHead(404).end("Not found");
    else {
      console.error("Erro ao servir arquivo local:", error.message);
      if (!response.headersSent) response.writeHead(500);
      response.end("Internal server error");
    }
  }
}

function sendJson(response, statusCode, value) {
  response.writeHead(statusCode, {
    "Cache-Control": "no-store",
    "Content-Type": "application/json; charset=utf-8",
    "X-Content-Type-Options": "nosniff",
  });
  response.end(JSON.stringify(value));
}

async function handleRequest(request, response) {
  if (!isAllowedOrigin(request)) {
    response.writeHead(403).end("Forbidden");
    return;
  }
  const url = new URL(request.url, `http://${HOST}:${PORT}`);
  if (url.pathname === "/api/trier/products") {
    if (request.method !== "GET") {
      response.writeHead(405, { Allow: "GET" }).end("Method not allowed");
      return;
    }
    if (!products.length && syncError) {
      sendJson(response, 503, { error: syncError, products: [], syncedAt: "" });
      return;
    }
    sendJson(response, 200, {
      products,
      syncedAt,
      cached: true,
      syncError,
    });
    return;
  }

  if (url.pathname === "/api/trier/events") {
    if (request.method !== "GET") {
      response.writeHead(405, { Allow: "GET" }).end("Method not allowed");
      return;
    }
    response.writeHead(200, {
      "Cache-Control": "no-cache",
      "Content-Type": "text/event-stream",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    });
    response.write(`event: trier-sync\ndata: ${JSON.stringify({
      type: syncInProgress ? "syncing" : "ready",
      syncedAt,
      count: products.length,
      error: syncError,
    })}\n\n`);
    eventClients.add(response);
    request.on("close", () => eventClients.delete(response));
    return;
  }

  if (request.method !== "GET" && request.method !== "HEAD") {
    response.writeHead(405, { Allow: "GET, HEAD" }).end("Method not allowed");
    return;
  }
  await serveStaticFile(request, response, url.pathname);
}

async function start() {
  if (!Number.isInteger(PORT) || PORT < 1024 || PORT > 65535) {
    throw new Error("A porta local deve ser um número entre 1024 e 65535.");
  }
  await loadProductCache();

  const server = http.createServer((request, response) => {
    handleRequest(request, response).catch((error) => {
      console.error("Erro no servidor local:", error.message);
      if (!response.headersSent) response.writeHead(500);
      response.end("Internal server error");
    });
  });
  server.on("error", (error) => {
    console.error(`Não foi possível iniciar o servidor local em ${HOST}:${PORT}: ${error.message}`);
    process.exitCode = 1;
  });
  server.listen(PORT, HOST, () => {
    console.log(`Atendimento aberto no navegador: http://${HOST}:${PORT}`);
    console.log("A sincronização Trier funciona em segundo plano a cada 5 minutos enquanto esta janela estiver aberta.");
    void syncProducts();
  });

  const interval = setInterval(syncProducts, SYNC_INTERVAL_MS);
  const shutdown = () => {
    clearInterval(interval);
    for (const response of eventClients) response.end();
    server.close(() => process.exit(0));
  };
  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);
}

start().catch((error) => {
  console.error("Não foi possível iniciar a página local:", error.message);
  process.exitCode = 1;
});
