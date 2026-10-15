const { spawn } = require("child_process");

let input = "";
process.stdin.setEncoding("utf8");
process.stdin.on("data", (chunk) => {
  input += chunk;
});
process.stdin.on("end", () => {
  let payload;
  try {
    payload = JSON.parse(input);
  } catch {
    console.error("Entrada inválida. Envie um JSON com token e, opcionalmente, baseUrl.");
    process.exitCode = 1;
    return;
  }

  const token = String(payload?.token || "").trim();
  const baseUrl = String(payload?.baseUrl || "http://localhost:4647/sgfpod1").trim();
  if (!token) {
    console.error("O token da Trier não foi informado.");
    process.exitCode = 1;
    return;
  }

  input = "";
  const builderCli = require.resolve("electron-builder/out/cli/cli.js");
  const child = spawn(process.execPath, [builderCli, "--win", "nsis", "--x64", "--publish", "never"], {
    cwd: process.cwd(),
    env: {
      ...process.env,
      TRIER_BUNDLED_TOKEN: token,
      TRIER_BUNDLED_BASE_URL: baseUrl,
    },
    stdio: ["ignore", "inherit", "inherit"],
  });
  child.on("exit", (code, signal) => {
    if (signal) {
      console.error(`Empacotamento interrompido pelo sinal ${signal}.`);
      process.exitCode = 1;
      return;
    }
    process.exitCode = code ?? 1;
  });
});
