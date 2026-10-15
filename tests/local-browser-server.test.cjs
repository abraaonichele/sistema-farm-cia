const assert = require("node:assert/strict");
const { spawn } = require("node:child_process");
const fs = require("node:fs/promises");
const http = require("node:http");
const net = require("node:net");
const os = require("node:os");
const path = require("node:path");
const { after, test } = require("node:test");

const PROJECT_ROOT = path.resolve(__dirname, "..");
const TEST_TOKEN = "local-browser-test-token";
let apiServer;
let bridgeProcess;
let dataDirectory;

after(async () => {
  if (bridgeProcess && bridgeProcess.exitCode === null) {
    bridgeProcess.kill("SIGTERM");
    await new Promise((resolve) => bridgeProcess.once("exit", resolve));
  }
  if (apiServer) {
    apiServer.closeAllConnections?.();
    await new Promise((resolve, reject) => apiServer.close((error) => error ? reject(error) : resolve()));
  }
  if (dataDirectory) await fs.rm(dataDirectory, { recursive: true, force: true });
});

async function findFreePort() {
  const server = net.createServer();
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  const { port } = server.address();
  await new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
  return port;
}

async function waitForProducts(url) {
  for (let attempt = 0; attempt < 50; attempt += 1) {
    try {
      const response = await fetch(url);
      if (response.ok) return response;
    } catch {
      // The local HTTP server may still be starting.
    }
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  throw new Error("The local Trier server did not become ready.");
}

test("local browser server syncs products, serves the UI, and keeps its token private", async () => {
  const apiPort = await findFreePort();
  const bridgePort = await findFreePort();
  dataDirectory = await fs.mkdtemp(path.join(os.tmpdir(), "farmacia-trier-local-"));
  let authHeader = "";
  apiServer = http.createServer((request, response) => {
    authHeader = request.headers.authorization;
    response.writeHead(200, { "Content-Type": "application/json" });
    response.end(JSON.stringify([{
      codigo: "B-001",
      codigoBarras: "7890001",
      nome: "Produto para teste",
      quantidadeEstoque: 8,
      valorVenda: 15.5,
      ativo: true,
    }]));
  });
  await new Promise((resolve) => apiServer.listen(apiPort, "127.0.0.1", resolve));

  bridgeProcess = spawn(process.execPath, ["scripts/serve-local-browser.cjs"], {
    cwd: PROJECT_ROOT,
    env: {
      ...process.env,
      APPDATA: dataDirectory,
      TRIER_API_BASE_URL: `http://127.0.0.1:${apiPort}/sgfpod1`,
      TRIER_API_TOKEN: TEST_TOKEN,
      TRIER_LOCAL_PORT: String(bridgePort),
    },
    stdio: "ignore",
  });

  const homeResponse = await waitForProducts(`http://127.0.0.1:${bridgePort}/`);
  assert.equal(homeResponse.status, 200);
  assert.match(await homeResponse.text(), /Orçamento WPP/);

  const productsResponse = await waitForProducts(`http://127.0.0.1:${bridgePort}/api/trier/products`);
  const payload = await productsResponse.json();
  assert.equal(authHeader, `Bearer ${TEST_TOKEN}`);
  assert.deepEqual(payload.products.map((product) => [product.code, product.stock, product.salePrice]), [
    ["B-001", 8, 15.5],
  ]);
  assert.equal(JSON.stringify(payload).includes(TEST_TOKEN), false);
  assert.equal((await fetch(`http://127.0.0.1:${bridgePort}/package.json`)).status, 404);
  assert.equal((await fetch(`http://127.0.0.1:${bridgePort}/assets/../package.json`)).status, 404);
  assert.equal((await fetch(`http://127.0.0.1:${bridgePort}/`, {
    headers: { Origin: "https://attacker.example" },
  })).status, 403);

  const cached = JSON.parse(await fs.readFile(
    path.join(dataDirectory, "Atendimento Inj Farmacia", "trier-products-cache.json"),
    "utf8",
  ));
  assert.equal(cached.products[0].code, "B-001");
  assert.equal(JSON.stringify(cached).includes(TEST_TOKEN), false);
});
