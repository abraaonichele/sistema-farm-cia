const http = require("node:http");
const https = require("node:https");
const { normalizeTrierBaseUrl } = require("./trier-products.cjs");

const TRIER_PDV_SALE_PATH = "/api/venda/efetuar-venda-v1";
const TRIER_PDV_REQUEST_TIMEOUT_MS = 30_000;
const TRIER_PDV_MAX_RESPONSE_BYTES = 1024 * 1024;
const TRIER_INT32_MAX = 2_147_483_647;

function isValidCpf(value) {
  if (!/^\d{11}$/.test(value) || /^(\d)\1{10}$/.test(value)) return false;
  const digits = [...value].map(Number);
  const calculateCheckDigit = (length) => {
    const sum = digits.slice(0, length).reduce((total, digit, index) => total + digit * (length + 1 - index), 0);
    const remainder = (sum * 10) % 11;
    return remainder === 10 ? 0 : remainder;
  };
  return calculateCheckDigit(9) === digits[9] && calculateCheckDigit(10) === digits[10];
}

function buildTrierEcommerceSale({ numeroPedido, customerName = "", customerCpf = "", items }) {
  const orderNumber = String(numeroPedido || "").trim();
  if (!orderNumber || orderNumber.length > 80) {
    throw new Error("Não foi possível identificar este orçamento para o PDV.");
  }
  if (!Array.isArray(items) || items.length === 0 || items.length > 500) {
    throw new Error("O orçamento precisa ter entre 1 e 500 produtos para ser enviado ao PDV.");
  }
  const normalizedCustomerName = String(customerName || "").trim();
  const normalizedCustomerCpf = String(customerCpf || "").replace(/\D/g, "");
  if (Boolean(normalizedCustomerName) !== Boolean(normalizedCustomerCpf)) {
    throw new Error("Para vincular o cliente ao pedido no PDV, informe nome e CPF.");
  }
  if (normalizedCustomerName && (normalizedCustomerName.length > 40 || !isValidCpf(normalizedCustomerCpf))) {
    throw new Error("O nome do cliente deve ter até 40 caracteres e o CPF deve ser válido para o PDV.");
  }

  const products = items.map((item) => {
    const code = String(item?.product?.code || "").trim();
    const quantity = Number(item?.quantity);
    const price = Number(item?.price);
    if (!/^\d+$/.test(code) || Number(code) < 1 || Number(code) > TRIER_INT32_MAX) {
      throw new Error(`O código do produto ${item?.product?.name || ""} é inválido para envio ao PDV.`);
    }
    if (!Number.isInteger(quantity) || quantity < 1 || quantity > TRIER_INT32_MAX) {
      throw new Error(`A quantidade do produto ${item?.product?.name || ""} é inválida.`);
    }
    if (!Number.isFinite(price) || price <= 0) {
      throw new Error(`O preço do produto ${item?.product?.name || ""} precisa ser maior que zero para enviar ao PDV.`);
    }

    const name = String(item.product.name || "").trim();
    if (!name || name.length > 30) {
      throw new Error(`O nome do produto ${name || code} precisa ter no máximo 30 caracteres para o PDV.`);
    }

    const unitPrice = Math.round((price + Number.EPSILON) * 100) / 100;
    if (unitPrice <= 0) {
      throw new Error(`O preço do produto ${name} precisa ser maior que zero para enviar ao PDV.`);
    }
    return {
      codigoProduto: Number(code),
      nomeProduto: name,
      quantidade: quantity,
      valorUnitario: unitPrice,
    };
  });
  const total = Math.round((products.reduce((sum, item) => sum + item.quantidade * item.valorUnitario, 0) + Number.EPSILON) * 100) / 100;
  if (!Number.isFinite(total) || total <= 0) {
    throw new Error("O total do orçamento precisa ser maior que zero para enviar ao PDV.");
  }

  const sale = {
    numeroPedido: orderNumber,
    dataPedido: new Date().toISOString(),
    valorTotalVenda: total,
    produtos: products,
  };
  if (normalizedCustomerName) {
    sale.cliente = {
      nome: normalizedCustomerName,
      numeroCpfCnpj: normalizedCustomerCpf,
    };
  }
  return sale;
}

function createTrierError(statusCode) {
  if (statusCode === 401 || statusCode === 403) {
    return new Error("A Trier recusou o token ou a permissão para integração com o PDV.");
  }
  if (statusCode === 404) {
    return new Error("A rota de vendas do PDV não foi encontrada neste endereço da Trier.");
  }
  if (statusCode === 400 || statusCode === 422) {
    return new Error("A Trier recusou os dados do orçamento. Confira produtos, preços e configuração do PDV.");
  }
  return new Error(`A API Trier respondeu com erro ${statusCode || "desconhecido"} ao enviar o orçamento.`);
}

function sendTrierEcommerceSale(config, sale) {
  const baseUrl = normalizeTrierBaseUrl(config?.baseUrl);
  const token = String(config?.token || "").trim();
  if (!token) throw new Error("Configure o token de integração Trier antes de enviar ao PDV.");
  const payload = buildTrierEcommerceSale(sale);
  const endpoint = new URL(`${baseUrl}${TRIER_PDV_SALE_PATH}`);
  const transport = endpoint.protocol === "https:" ? https : http;

  return new Promise((resolve, reject) => {
    const body = JSON.stringify(payload);
    const request = transport.request(endpoint, {
      method: "POST",
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        "Content-Length": Buffer.byteLength(body),
      },
      timeout: TRIER_PDV_REQUEST_TIMEOUT_MS,
    }, (response) => {
      const chunks = [];
      let responseBytes = 0;
      response.on("data", (chunk) => {
        responseBytes += chunk.length;
        if (responseBytes > TRIER_PDV_MAX_RESPONSE_BYTES) {
          request.destroy(new Error("A resposta da Trier excedeu o limite de segurança."));
          return;
        }
        chunks.push(chunk);
      });
      response.on("end", () => {
        if (!response.statusCode || response.statusCode < 200 || response.statusCode >= 300) {
          reject(createTrierError(response.statusCode));
          return;
        }

        let result;
        try {
          result = JSON.parse(Buffer.concat(chunks).toString("utf8"));
        } catch {
          reject(new Error(`A Trier respondeu ao pedido ${payload.numeroPedido}, mas a resposta não pôde ser confirmada. Verifique o PDV antes de tentar novamente.`));
          return;
        }

        const saleNumber = Number(result?.numeroNota);
        if (!Number.isSafeInteger(saleNumber) || saleNumber < 1) {
          reject(new Error(`A Trier respondeu ao pedido ${payload.numeroPedido}, mas não retornou o número da venda. Verifique o PDV antes de tentar novamente.`));
          return;
        }
        resolve({
          numeroNota: saleNumber,
          numeroPedido: String(result.numeroPedido || payload.numeroPedido),
          statusPedido: result.statusPedido?.descricao
            ? String(result.statusPedido.descricao)
            : "",
        });
      });
    });
    request.on("timeout", () => request.destroy(new Error("A conexão com a Trier excedeu o tempo limite. Verifique o PDV antes de tentar novamente.")));
    request.on("error", (error) => {
      if (/ECONNREFUSED|ENOTFOUND|EHOSTUNREACH|ETIMEDOUT/i.test(String(error?.code || error?.message))) {
        reject(new Error("Não foi possível acessar a API da Trier para enviar o orçamento ao PDV."));
        return;
      }
      reject(error);
    });
    request.end(body);
  });
}

module.exports = {
  TRIER_PDV_SALE_PATH,
  buildTrierEcommerceSale,
  sendTrierEcommerceSale,
};
