const fs = require("fs/promises");
const readline = require("readline/promises");
const { stdin, stdout } = require("process");
const { getLocalTrierConfigPath, getLocalTrierDataDirectory } = require("./local-trier-config.cjs");
const { normalizeTrierBaseUrl, TRIER_DEFAULT_BASE_URL } = require("../trier-products.cjs");

function readHidden(prompt) {
  if (!stdin.isTTY || typeof stdin.setRawMode !== "function") {
    throw new Error("Execute esta configuração em um terminal interativo para ocultar o token enquanto digita.");
  }
  return new Promise((resolve, reject) => {
    stdout.write(prompt);
    stdin.setRawMode(true);
    stdin.resume();
    let value = "";
    const onData = (chunk) => {
      const input = chunk.toString("utf8");
      for (const character of input) {
        if (character === "\u0003") {
          cleanup();
          reject(new Error("Configuração cancelada."));
          return;
        }
        if (character === "\r" || character === "\n") {
          cleanup();
          stdout.write("\n");
          resolve(value.trim());
          return;
        }
        if (character === "\u007f" || character === "\b") {
          value = value.slice(0, -1);
          continue;
        }
        if (character >= " " && character !== "\u007f") value += character;
      }
    };
    const cleanup = () => {
      stdin.off("data", onData);
      stdin.setRawMode(false);
      stdin.pause();
    };
    stdin.on("data", onData);
  });
}

async function main() {
  const prompt = readline.createInterface({ input: stdin, output: stdout });
  try {
    const baseUrl = normalizeTrierBaseUrl(await prompt.question(
      `Endereço base da API Trier [${TRIER_DEFAULT_BASE_URL}]: `,
    ) || TRIER_DEFAULT_BASE_URL);
    prompt.close();

    const token = await readHidden("Token da Trier (não será exibido): ");
    if (!token) throw new Error("O token da Trier não pode ficar vazio.");

    const directory = getLocalTrierDataDirectory();
    await fs.mkdir(directory, { recursive: true, mode: 0o700 });
    await fs.writeFile(
      getLocalTrierConfigPath(),
      `${JSON.stringify({ baseUrl, token, updatedAt: new Date().toISOString() }, null, 2)}\n`,
      { mode: 0o600 },
    );
    if (process.platform !== "win32") {
      await fs.chmod(getLocalTrierConfigPath(), 0o600);
      await fs.chmod(directory, 0o700);
    }
    console.log("Configuração local salva fora da pasta do projeto. O token não foi exibido nem enviado ao navegador.");
  } finally {
    prompt.close();
  }
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
