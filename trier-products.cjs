const http = require("http");
const https = require("https");
const fs = require("fs/promises");
const path = require("path");

const TRIER_DEFAULT_BASE_URL = "https://api-sgf-gateway.triersistemas.com.br/sgfpod1";
const TRIER_PAGE_SIZE = 500;
const TRIER_MAX_PRODUCTS = 200_000;
const TRIER_CACHE_SCHEMA_VERSION = 1;
const TRIER_CACHE_MAX_BYTES = 100 * 1024 * 1024;

function normalizeTrierBaseUrl(value) {
  const rawValue = String(value || TRIER_DEFAULT_BASE_URL).trim().replace(/\/+$/, "");
  let parsed;
  try {
    parsed = new URL(rawValue);
  } catch {
    throw new Error("Informe um endereço válido para a API Trier.");
  }
  if (!["http:", "https:"].includes(parsed.protocol)) {
    throw new Error("A API Trier precisa usar um endereço HTTP ou HTTPS.");
  }
  if (parsed.protocol === "http:" && !["localhost", "127.0.0.1", "::1"].includes(parsed.hostname)) {
    throw new Error("Use HTTPS para enviar o token da Trier a um servidor remoto.");
  }
  return parsed.toString().replace(/\/+$/, "");
}

function requestTrierJson(url, token) {
  return new Promise((resolve, reject) => {
    const parsed = new URL(url);
    const transport = parsed.protocol === "https:" ? https : http;
    const request = transport.request(parsed, {
      method: "GET",
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${token}`,
      },
      timeout: 20_000,
    }, (response) => {
      const chunks = [];
      let responseBytes = 0;
      response.on("data", (chunk) => {
        responseBytes += chunk.length;
        if (responseBytes > 25 * 1024 * 1024) {
          request.destroy(new Error("A resposta da Trier excedeu o limite de segurança."));
          return;
        }
        chunks.push(chunk);
      });
      response.on("end", () => {
        const body = Buffer.concat(chunks).toString("utf8");
        if (response.statusCode === 401 || response.statusCode === 403) {
          reject(new Error("A Trier recusou o token de integração. Confira a credencial configurada."));
          return;
        }
        if (response.statusCode === 404) {
          reject(new Error("A rota de produtos não foi encontrada. Confira o endereço base da API Trier."));
          return;
        }
        if (!response.statusCode || response.statusCode < 200 || response.statusCode >= 300) {
          reject(new Error(`A API Trier respondeu com erro ${response.statusCode || "desconhecido"}.`));
          return;
        }
        try {
          resolve(JSON.parse(body));
        } catch {
          reject(new Error("A API Trier devolveu uma resposta que não está em formato JSON."));
        }
      });
    });
    request.on("timeout", () => request.destroy(new Error("A conexão com a API Trier excedeu o tempo limite.")));
    request.on("error", (error) => {
      if (/ECONNREFUSED|ENOTFOUND|EHOSTUNREACH|ETIMEDOUT/i.test(String(error?.code || error?.message))) {
        reject(new Error("Não foi possível acessar o servidor Trier. Confira o endereço/IP e se a API SGF está ativa."));
        return;
      }
      reject(error);
    });
    request.end();
  });
}

function sanitizeTrierProduct(product) {
  const numberOrNull = (value) => {
    if (value === null || value === undefined || value === "") return null;
    const number = Number(value);
    return Number.isFinite(number) ? number : null;
  };
  return {
    code: String(product?.codigo ?? ""),
    barcode: String(product?.codigoBarras ?? ""),
    name: String(product?.nome || "Produto sem nome").trim(),
    unit: String(product?.unidade || "UN").trim(),
    stock: numberOrNull(product?.quantidadeEstoque) ?? 0,
    salePrice: numberOrNull(product?.valorVenda) ?? 0,
    costPrice: numberOrNull(product?.valorCusto),
    averageCost: numberOrNull(product?.valorCustoMedio),
    laboratory: String(product?.nomeLaboratorio || "").trim(),
    active: product?.ativo !== false,
  };
}

async function fetchTrierProducts(config, options = {}) {
  const baseUrl = normalizeTrierBaseUrl(config?.baseUrl);
  const token = String(config?.token || "").trim();
  if (!token) {
    const error = new Error("O token da Trier não está disponível para a sincronização automática.");
    error.code = "TRIER_NOT_CONFIGURED";
    throw error;
  }

  const pageSize = options.pageSize || TRIER_PAGE_SIZE;
  const maxProducts = options.maxProducts || TRIER_MAX_PRODUCTS;
  const products = [];
  for (let offset = 0; offset < maxProducts; offset += pageSize) {
    const url = new URL(`${baseUrl}/rest/integracao/produto/obter-v1`);
    url.searchParams.set("ativo", "true");
    url.searchParams.set("processaCustoMedio", "true");
    url.searchParams.set("primeiroRegistro", String(offset));
    url.searchParams.set("quantidadeRegistros", String(pageSize));
    const page = await requestTrierJson(url.toString(), token);
    if (!Array.isArray(page)) throw new Error("A API Trier não devolveu uma lista de produtos válida.");
    products.push(...page.map(sanitizeTrierProduct));
    if (page.length < pageSize) return products;
  }

  throw new Error(`A sincronização excedeu o limite de ${maxProducts} produtos.`);
}

async function loadTrierProductCache(cachePath, expectedBaseUrl) {
  let cacheFile;
  try {
    cacheFile = await fs.open(cachePath, "r");
  } catch (error) {
    if (error?.code === "ENOENT") return null;
    throw error;
  }

  try {
    const info = await cacheFile.stat();
    if (!info.isFile() || info.size > TRIER_CACHE_MAX_BYTES) {
      throw new Error("O cache local de produtos da Trier é inválido ou excede o limite permitido.");
    }
    const cache = JSON.parse(await cacheFile.readFile("utf8"));
    const baseUrl = normalizeTrierBaseUrl(cache?.baseUrl);
    const syncedAt = typeof cache?.syncedAt === "string" ? cache.syncedAt : "";
    if (cache?.schemaVersion !== TRIER_CACHE_SCHEMA_VERSION
      || !Number.isFinite(Date.parse(syncedAt))
      || !Array.isArray(cache.products)
      || cache.products.length > TRIER_MAX_PRODUCTS
      || !cache.products.every(isSanitizedTrierProduct)) {
      throw new Error("O cache local da Trier está inválido.");
    }
    if (baseUrl !== normalizeTrierBaseUrl(expectedBaseUrl)) return null;
    return { products: cache.products, syncedAt, baseUrl };
  } finally {
    await cacheFile.close();
  }
}

async function saveTrierProductCache(cachePath, { products, syncedAt, baseUrl }) {
  if (!Array.isArray(products) || products.length > TRIER_MAX_PRODUCTS) {
    throw new Error("A lista de produtos da Trier não pode ser armazenada no cache.");
  }
  const cache = {
    schemaVersion: TRIER_CACHE_SCHEMA_VERSION,
    baseUrl: normalizeTrierBaseUrl(baseUrl),
    syncedAt,
    products,
  };
  const serialized = `${JSON.stringify(cache)}\n`;
  if (Buffer.byteLength(serialized, "utf8") > TRIER_CACHE_MAX_BYTES) {
    throw new Error("O catálogo de produtos da Trier excede o limite permitido para o cache local.");
  }

  await fs.mkdir(path.dirname(cachePath), { recursive: true, mode: 0o700 });
  const temporaryPath = `${cachePath}.${process.pid}.tmp`;
  try {
    await fs.writeFile(temporaryPath, serialized, { mode: 0o600 });
    await fs.rename(temporaryPath, cachePath);
    if (process.platform !== "win32") await fs.chmod(cachePath, 0o600);
  } catch (error) {
    try {
      await fs.rm(temporaryPath, { force: true });
    } catch (cleanupError) {
      console.error("Não foi possível limpar o arquivo temporário do cache Trier:", cleanupError);
    }
    throw error;
  }
}

function isSanitizedTrierProduct(product) {
  return product !== null
    && typeof product === "object"
    && typeof product.code === "string"
    && typeof product.barcode === "string"
    && typeof product.name === "string"
    && typeof product.unit === "string"
    && Number.isFinite(product.stock)
    && Number.isFinite(product.salePrice)
    && (product.costPrice === null || Number.isFinite(product.costPrice))
    && (product.averageCost === null || Number.isFinite(product.averageCost))
    && typeof product.laboratory === "string"
    && typeof product.active === "boolean";
}

module.exports = {
  TRIER_DEFAULT_BASE_URL,
  fetchTrierProducts,
  loadTrierProductCache,
  normalizeTrierBaseUrl,
  saveTrierProductCache,
};
