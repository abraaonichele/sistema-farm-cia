const fs = require("node:fs");
const path = require("node:path");
const { Arch, Platform, build } = require("electron-builder");

const projectDir = path.resolve(__dirname, "..");
const installersDir = path.join(projectDir, "instaladores");
const configurations = {
  windows: {
    folder: "windows",
    target: Platform.WINDOWS.createTarget("nsis", Arch.x64),
  },
  "windows-ia32": {
    folder: "windows",
    target: Platform.WINDOWS.createTarget("nsis", Arch.ia32),
  },
  "windows-portable": {
    folder: "windows",
    target: Platform.WINDOWS.createTarget("portable", Arch.x64),
  },
  macos: {
    folder: "Macos",
    target: Platform.MAC.createTarget(["dmg", "zip"], Arch.universal),
  },
};

async function buildInstaller(platform) {
  const configuration = configurations[platform];
  if (!configuration) {
    throw new Error(`Plataforma de instalador desconhecida: ${platform}`);
  }

  const outputDir = path.join(installersDir, configuration.folder);
  const stagingDir = path.join(installersDir, `.${configuration.folder}-staging`);
  fs.rmSync(stagingDir, { recursive: true, force: true });
  fs.mkdirSync(stagingDir, { recursive: true });

  try {
    await build({
      targets: configuration.target,
      // `publish` é uma opção do build (política de publicação), não um
      // provedor dentro de `config`. Colocá-lo no config faz o electron-builder
      // procurar um provedor chamado "never" e quebra o build no Windows.
      publish: "never",
      config: {
        directories: {
          output: stagingDir,
        },
      },
    });

    const installerExtensions = platform.startsWith("windows") ? [".exe"] : [".dmg", ".zip"];
    for (const entry of fs.readdirSync(stagingDir, { withFileTypes: true })) {
      const ext = path.extname(entry.name).toLowerCase();
      const fullPath = path.join(stagingDir, entry.name);
      const shouldKeep = entry.isFile() && (installerExtensions.includes(ext) || ext === ".yml");
      if (!shouldKeep) {
        fs.rmSync(fullPath, { recursive: true, force: true });
      }
    }

    // O electron-builder pode gerar nomes diferentes para os artefatos do
    // macOS e para os nomes registrados no latest-mac.yml. O updater usa o
    // YAML como fonte da URL, então os arquivos precisam ter exatamente os
    // mesmos nomes publicados.
    if (platform === "macos") {
      const updateInfoPath = path.join(stagingDir, "latest-mac.yml");
      const updateInfo = fs.readFileSync(updateInfoPath, "utf8");
      const expectedNames = [...updateInfo.matchAll(/^\s*-?\s*url:\s*(\S+)$/gm)].map((match) => match[1]);
      for (const expectedName of expectedNames) {
        const expectedPath = path.join(stagingDir, expectedName);
        if (fs.existsSync(expectedPath)) continue;
        const sourceEntry = fs.readdirSync(stagingDir, { withFileTypes: true }).find((entry) => entry.isFile() && path.extname(entry.name).toLowerCase() === path.extname(expectedName).toLowerCase());
        if (sourceEntry) fs.renameSync(path.join(stagingDir, sourceEntry.name), expectedPath);
      }
    }

    fs.rmSync(outputDir, { recursive: true, force: true });
    // Windows: renameSync pode falhar se houver locks; usa copy+remove como fallback
    try {
      fs.renameSync(stagingDir, outputDir);
    } catch (e) {
      if (e.code === 'EPERM' || e.code === 'ENOTEMPTY') {
        fs.cpSync(stagingDir, outputDir, { recursive: true });
        fs.rmSync(stagingDir, { recursive: true, force: true });
      } else {
        throw e;
      }
    }
    console.log(`Instalador ${platform} atualizado em ${outputDir}`);
  } finally {
    fs.rmSync(stagingDir, { recursive: true, force: true });
  }
}

async function main() {
  const requestedPlatform = process.argv[2];
  const platforms = requestedPlatform === "all"
    ? ["windows", "macos"]
    : [requestedPlatform];

  if (!platforms.every((platform) => configurations[platform])) {
    throw new Error("Use: node scripts/build-installers.cjs windows|windows-ia32|windows-portable|macos|all");
  }

  for (const platform of platforms) {
    await buildInstaller(platform);
  }
}

main().catch((error) => {
  console.error("Não foi possível gerar os instaladores:", error);
  process.exitCode = 1;
});
