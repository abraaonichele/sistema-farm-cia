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
    target: Platform.MAC.createTarget("dmg", Arch.universal),
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
      config: {
        directories: {
          output: stagingDir,
        },
      },
    });

    const installerExtension = platform.startsWith("windows") ? ".exe" : ".dmg";
    for (const entry of fs.readdirSync(stagingDir, { withFileTypes: true })) {
      const ext = path.extname(entry.name).toLowerCase();
      const fullPath = path.join(stagingDir, entry.name);
      const shouldKeep = entry.isFile() && (ext === installerExtension || ext === ".yml");
      if (!shouldKeep) {
        fs.rmSync(fullPath, { recursive: true, force: true });
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
