import fs from "node:fs";
import path from "node:path";
import zlib from "node:zlib";
import { fileURLToPath } from "node:url";

const root = path.dirname(fileURLToPath(import.meta.url));
const dataDir = path.join(root, "bulas-medicamentos");

function readGeneratedJson(fileName, prefix) {
  const source = fs.readFileSync(path.join(dataDir, fileName), "utf8");
  return JSON.parse(source.replace(prefix, "").replace(/;\s*$/, ""));
}

function writeGzipJson(fileName, value) {
  const json = JSON.stringify(value);
  const compressed = zlib.gzipSync(json, { level: 9 });
  fs.writeFileSync(path.join(dataDir, fileName), compressed);
  return { jsonBytes: Buffer.byteLength(json), gzipBytes: compressed.length };
}

const raia = readGeneratedJson("medicine-library-raia.generated.js", "window.RAIA_MEDICINE_LIBRARY = ");
const xlsx = readGeneratedJson("medicine-library-xlsx.generated.js", "window.XLSX_MEDICINE_LIBRARY = ");
const aliases = readGeneratedJson("ean-medicine-aliases.generated.js", "window.EAN_MEDICINE_ALIASES = ");
const compactAliases = Object.fromEntries(Object.entries(aliases).map(([ean, alias]) => [ean, {
  ean: alias.ean,
  candidateSlug: alias.candidateSlug,
  strength: alias.strength,
  form: alias.form,
  activeIngredient: alias.activeIngredient,
  commercialName: alias.commercialName,
}]));

const report = {
  raia: writeGzipJson("medicine-library-raia.json.gz", raia),
  xlsx: writeGzipJson("medicine-library-xlsx.json.gz", xlsx),
  aliases: writeGzipJson("ean-medicine-aliases.json.gz", compactAliases),
};

console.log(JSON.stringify(report));
