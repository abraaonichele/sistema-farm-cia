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

const SHOULD_PUBLISH = process.argv.includes("--publish");

async function buildInstaller(platform) {
  const configuration = configurations[platform];
  if (!configuration) {
    throw new Error(`Plataforma de instalador desconhecida: ${platform}`);
  }

  const outputDir = path.join(installersDir, configuration.folder);
  const stagingDir = path.join(installersDir, `.${configuration.folder}-staging`);
  fs.rmSync(stagingDir, { recursive: true, force: true });
  fs.mkdirSync(stagingDir, { recursive: true });

  console.log(`[${platform}] Iniciando build...`);
  console.log(`[${platform}] stagingDir: ${stagingDir}`);
  console.log(`[${platform}] outputDir: ${outputDir}`);
  console.log(`[${platform}] target: ${configuration.target}`);

  try {
    const result = await build({
      targets: configuration.target,
      publish: SHOULD_PUBLISH ? "always" : "never",
      config: {
        directories: {
          output: stagingDir,
        },
      },
    });
    console.log(`[${platform}] Build result:`, result);
    console.log(`[${platform}] stagingDir contents after build:`, fs.readdirSync(stagingDir));

    const installerExtension = platform.startsWith("windows") ? ".exe" : ".dmg";
    for (const entry of fs.readdirSync(stagingDir, { withFileTypes: true })) {
      const ext = path.extname(entry.name).toLowerCase();
      const fullPath = path.join(stagingDir, entry.name);
      const shouldKeep = entry.isFile() && (ext === installerExtension || ext === ".yml");
      if (!shouldKeep) {
        fs.rmSync(fullPath, { recursive: true, force: true });
      }
    }
    console.log(`[${platform}] stagingDir contents after filter:`, fs.readdirSync(stagingDir));

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
    console.log(`[${platform}] Instalador atualizado em ${outputDir}`);
    console.log(`[${platform}] outputDir contents:`, fs.readdirSync(outputDir));
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
