const assert = require("node:assert/strict");
const http = require("node:http");
const { after, test } = require("node:test");
const {
  TRIER_PDV_SALE_PATH,
  buildTrierEcommerceSale,
  sendTrierEcommerceSale,
} = require("../trier-sales.cjs");

let server;
let baseUrl;
let requests = [];
let incompleteResponse = false;

after(async () => {
  if (server) {
    await new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
  }
});

test("builds the Trier PDV payload from the edited quote totals and products", () => {
  const sale = buildTrierEcommerceSale({
    numeroPedido: "ORC-123",
    items: [
      { product: { code: "23", name: "Produto A" }, quantity: 2, price: 17.555 },
      { product: { code: "24", name: "Produto B" }, quantity: 1, price: 3.4 },
    ],
  });

  assert.equal(sale.numeroPedido, "ORC-123");
  assert.match(sale.dataPedido, /^\d{4}-\d{2}-\d{2}T/);
  assert.equal(sale.valorTotalVenda, 38.52);
  assert.deepEqual(sale.produtos, [
    { codigoProduto: 23, nomeProduto: "Produto A", quantidade: 2, valorUnitario: 17.56 },
    { codigoProduto: 24, nomeProduto: "Produto B", quantidade: 1, valorUnitario: 3.4 },
  ]);
  assert.equal("cliente" in sale, false);
});

test("includes a customer only when both name and CPF are provided", () => {
  const sale = buildTrierEcommerceSale({
    numeroPedido: "ORC-CLIENT",
    customerName: "Maria da Silva",
    customerCpf: "123.456.789-09",
    items: [{ product: { code: "23", name: "Produto A" }, quantity: 1, price: 17.55 }],
  });
  assert.deepEqual(sale.cliente, { nome: "Maria da Silva", numeroCpfCnpj: "12345678909" });
  assert.throws(() => buildTrierEcommerceSale({
    numeroPedido: "ORC-CLIENT",
    customerName: "Maria da Silva",
    items: [{ product: { code: "23", name: "Produto A" }, quantity: 1, price: 17.55 }],
  }), /nome e CPF/);
  assert.throws(() => buildTrierEcommerceSale({
    numeroPedido: "ORC-CLIENT",
    customerName: "Maria da Silva",
    customerCpf: "12345678901",
    items: [{ product: { code: "23", name: "Produto A" }, quantity: 1, price: 17.55 }],
  }), /CPF deve ser válido/);
});

test("rejects values that the Trier PDV API cannot accept", () => {
  const makeSale = (overrides = {}) => buildTrierEcommerceSale({
    numeroPedido: "ORC-123",
    items: [{ product: { code: "23", name: "Produto A" }, quantity: 1, price: 17.55 }],
    ...overrides,
  });

  assert.throws(() => makeSale({ items: [] }), /entre 1 e 500/);
  assert.throws(() => makeSale({ items: [{ product: { code: "ABC", name: "Produto A" }, quantity: 1, price: 17.55 }] }), /código do produto/);
  assert.throws(() => makeSale({ items: [{ product: { code: "23", name: "Produto A" }, quantity: 1, price: 0 }] }), /maior que zero/);
  assert.throws(() => makeSale({ items: [{ product: { code: "23", name: "Nome de produto que excede o limite da Trier" }, quantity: 1, price: 17.55 }] }), /30 caracteres/);
});

test("sends the order with bearer authentication and returns the PDV sale number", async () => {
  requests = [];
  server = http.createServer(async (request, response) => {
    const chunks = [];
    for await (const chunk of request) chunks.push(chunk);
    requests.push({
      method: request.method,
      url: request.url,
      authorization: request.headers.authorization,
      body: JSON.parse(Buffer.concat(chunks).toString("utf8")),
    });
    response.writeHead(200, { "Content-Type": "application/json" });
    response.end(JSON.stringify(incompleteResponse
      ? { numeroPedido: "ORC-789" }
      : {
        numeroNota: 456,
        numeroPedido: "ORC-456",
        statusPedido: { descricao: "Aguardando confirmação no PDV" },
      }));
  });
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  baseUrl = `http://127.0.0.1:${server.address().port}/sgfpod1`;

  const result = await sendTrierEcommerceSale(
    { baseUrl, token: "test-token" },
    {
      numeroPedido: "ORC-456",
      customerName: "Maria da Silva",
      customerCpf: "12345678909",
      items: [{ product: { code: "23", name: "Produto A" }, quantity: 1, price: 17.55 }],
    },
  );

  assert.deepEqual(result, {
    numeroNota: 456,
    numeroPedido: "ORC-456",
    statusPedido: "Aguardando confirmação no PDV",
  });
  assert.equal(requests.length, 1);
  assert.equal(requests[0].method, "POST");
  assert.equal(requests[0].url, `/sgfpod1${TRIER_PDV_SALE_PATH}`);
  assert.equal(requests[0].authorization, "Bearer test-token");
  assert.equal(requests[0].body.numeroPedido, "ORC-456");
  assert.deepEqual(requests[0].body.cliente, { nome: "Maria da Silva", numeroCpfCnpj: "12345678909" });
});

test("does not treat an incomplete success response as a confirmed PDV order", async () => {
  incompleteResponse = true;

  await assert.rejects(
    sendTrierEcommerceSale(
      { baseUrl, token: "test-token" },
      {
        numeroPedido: "ORC-789",
        items: [{ product: { code: "23", name: "Produto A" }, quantity: 1, price: 17.55 }],
      },
    ),
    /Verifique o PDV antes de tentar novamente/,
  );
});
