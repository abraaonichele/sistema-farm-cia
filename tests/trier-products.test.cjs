const assert = require("node:assert/strict");
const http = require("node:http");
const { after, test } = require("node:test");
const { fetchTrierProducts, normalizeTrierBaseUrl } = require("../trier-products.cjs");

let server;
let baseUrl;
const requests = [];

after(async () => {
  if (!server) return;
  await new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
});

test("normalizes the configured Trier base URL", () => {
  assert.equal(normalizeTrierBaseUrl("http://localhost:4647/sgfpod1///"), "http://localhost:4647/sgfpod1");
  assert.throws(() => normalizeTrierBaseUrl("file:///tmp/trier"), /HTTP ou HTTPS/);
});

test("loads all product pages and returns sanitized product records", async () => {
  server = http.createServer((request, response) => {
    requests.push({
      authorization: request.headers.authorization,
      url: new URL(request.url, baseUrl),
    });
    response.writeHead(200, { "Content-Type": "application/json" });
    const offset = Number(new URL(request.url, baseUrl).searchParams.get("primeiroRegistro"));
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
          ativo: true,
          campoInterno: "não deve ser exportado",
        },
        { codigo: "24", nome: "Produto B" },
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

  assert.equal(requests.length, 2);
  assert.deepEqual(requests.map(({ url }) => url.searchParams.get("primeiroRegistro")), ["0", "2"]);
  assert.ok(requests.every(({ authorization }) => authorization === "Bearer test-secret"));
  assert.deepEqual(products[0], {
    code: "23",
    barcode: "789",
    name: "Produto A",
    unit: "CX",
    stock: 12,
    salePrice: 19.9,
    costPrice: 8.1,
    averageCost: null,
    laboratory: "Laboratório A",
    active: true,
  });
  assert.equal(products[1].unit, "UN");
  assert.equal(products[1].stock, 0);
  assert.equal(products.length, 3);
  assert.equal("campoInterno" in products[0], false);
});
