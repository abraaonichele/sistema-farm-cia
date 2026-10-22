const assert = require("node:assert/strict");
const fs = require("node:fs/promises");
const http = require("node:http");
const os = require("node:os");
const path = require("node:path");
const { after, test } = require("node:test");
const {
  TRIER_DEFAULT_BASE_URL,
  fetchTrierProducts,
  loadTrierProductCache,
  normalizeTrierBaseUrl,
  saveTrierProductCache,
} = require("../trier-products.cjs");

let server;
let baseUrl;
let cacheDirectory;
const requests = [];

after(async () => {
  if (server) {
    await new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
  }
  if (cacheDirectory) await fs.rm(cacheDirectory, { recursive: true, force: true });
});

test("normalizes the configured Trier base URL", () => {
  assert.equal(TRIER_DEFAULT_BASE_URL, "https://api-sgf-gateway.triersistemas.com.br/sgfpod1");
  assert.equal(normalizeTrierBaseUrl("http://localhost:4647/sgfpod1///"), "http://localhost:4647/sgfpod1");
  assert.throws(() => normalizeTrierBaseUrl("file:///tmp/trier"), /HTTP ou HTTPS/);
  assert.throws(() => normalizeTrierBaseUrl("http://192.168.1.25:4647/sgfpod1"), /Use HTTPS/);
});

test("loads all product pages and returns sanitized product records", async () => {
  server = http.createServer((request, response) => {
    requests.push({
      authorization: request.headers.authorization,
      url: new URL(request.url, baseUrl),
    });
    response.writeHead(200, { "Content-Type": "application/json" });
    const requestUrl = new URL(request.url, baseUrl);
    const offset = Number(requestUrl.searchParams.get("primeiroRegistro"));
    if (requestUrl.pathname.endsWith("/desconto/melhor/obter-v1")) {
      response.end(JSON.stringify(offset === 0 ? [{ codigoProduto: 23, valorPromocao: "17.50" }] : []));
      return;
    }
    const products = offset === 0
      ? [
        {
          codigo: 23,
          codigoBarras: 789,
          nome: "  Produto A  ",
          unidade: "CX",
          quantidadeEstoque: "12",
          valorVenda: "19.90",
          valorCusto: "8.10",
          valorCustoMedio: null,
          nomeLaboratorio: "Laboratório A",
          principioAtivo: "Composto A",
          ativo: true,
          campoInterno: "não deve ser exportado",
        },
        { codigo: "24", nome: "Produto B", valorVenda: "29.90", valorVendaComDesconto: "0" },
      ]
      : [{ codigo: "25", nome: "Produto C", quantidadeEstoque: 3, ativo: true }];
    response.end(JSON.stringify(products));
  });
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  baseUrl = `http://127.0.0.1:${server.address().port}/sgfpod1`;

  const products = await fetchTrierProducts(
    { baseUrl, token: "test-secret" },
    { pageSize: 2, maxProducts: 10 },
  );

  assert.equal(requests.length, 3);
  assert.deepEqual(requests.map(({ url }) => url.searchParams.get("primeiroRegistro")), ["0", "2", "0"]);
  assert.equal(requests[2].url.pathname, "/sgfpod1/rest/integracao/produto/desconto/melhor/obter-v1");
  assert.equal(requests[2].url.searchParams.get("considerarTodasCondicoesPagamento"), "true");
  assert.ok(requests.every(({ authorization }) => authorization === "Bearer test-secret"));
  assert.deepEqual(products[0], {
    code: "23",
    barcode: "789",
    name: "Produto A",
    unit: "CX",
    stock: 12,
    salePrice: 17.5,
    regularSalePrice: 19.9,
    hasDiscount: true,
    costPrice: 8.1,
    averageCost: null,
    laboratory: "Laboratório A",
    activeIngredient: "Composto A",
    active: true,
  });
  assert.equal(products[1].unit, "UN");
  assert.equal(products[1].stock, 0);
  assert.equal(products[1].salePrice, 29.9);
  assert.equal(products[1].hasDiscount, false);
  assert.equal(products.length, 3);
  assert.equal("campoInterno" in products[0], false);
});

test("persists the sanitized product catalog and only loads it for its Trier server", async () => {
  cacheDirectory = await fs.mkdtemp(path.join(os.tmpdir(), "trier-product-cache-"));
  const cachePath = path.join(cacheDirectory, "trier-products-cache.json");
  const cacheBaseUrl = "http://127.0.0.1:4647/sgfpod1";
  const products = [{
    code: "23",
    barcode: "789",
    name: "Produto A",
    unit: "CX",
    stock: 12,
    salePrice: 19.9,
    costPrice: 8.1,
    averageCost: null,
    laboratory: "Laboratório A",
    activeIngredient: "Composto A",
    active: true,
  }];
  const syncedAt = new Date().toISOString();

  await saveTrierProductCache(cachePath, { products, syncedAt, baseUrl: cacheBaseUrl });
  const cache = await loadTrierProductCache(cachePath, cacheBaseUrl);

  assert.deepEqual(cache, {
    products: [{ ...products[0], regularSalePrice: 19.9, hasDiscount: false }],
    syncedAt,
    baseUrl: cacheBaseUrl,
  });
  assert.equal(await loadTrierProductCache(cachePath, "http://127.0.0.1:9999/sgfpod1"), null);
  if (process.platform !== "win32") {
    assert.equal((await fs.stat(cachePath)).mode & 0o777, 0o600);
  }
});

test("rejects malformed product cache data", async () => {
  const cachePath = path.join(cacheDirectory, "corrupt-cache.json");
  await fs.writeFile(cachePath, JSON.stringify({
    schemaVersion: 1,
    baseUrl: "http://127.0.0.1:4647/sgfpod1",
    syncedAt: new Date().toISOString(),
    products: [{ code: "unsafe", stock: "not a number" }],
  }));

  await assert.rejects(
    loadTrierProductCache(cachePath, "http://127.0.0.1:4647/sgfpod1"),
    /inválido/,
  );
});
