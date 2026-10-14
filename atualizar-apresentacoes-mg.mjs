import { readFile, writeFile } from "node:fs/promises";
import { spawn } from "node:child_process";
import { once } from "node:events";

if (process.argv.includes("--until-complete")) {
  const childArgs = process.argv.slice(2).filter((argument) => argument !== "--until-complete");
  while (true) {
    const child = spawn(process.execPath, [new URL(import.meta.url).pathname, ...childArgs], { stdio: "inherit" });
    const [exitCode] = await once(child, "close");
    if (exitCode !== 0) process.exit(exitCode || 1);
    const state = JSON.parse(await readFile("/Users/mega/Documents/injetaveis/bulas-medicamentos/importacao-bulas-raia-progresso.json", "utf8"));
    if (!state.medicines.some((medicine) => !medicine.presentationsChecked)) break;
  }
  process.exit(0);
}

const ROOT = "/Users/mega/Documents/injetaveis/bulas-medicamentos";
const progressPath = `${ROOT}/importacao-bulas-raia-progresso.json`;
const libraryPath = `${ROOT}/medicine-library-raia.generated.js`;
const batchSize = Math.max(1, Number(process.argv.find((argument) => argument.startsWith("--batch="))?.split("=")[1] || 20));

function decodeHtml(value = "") {
  return value.replace(/<br\s*\/?/gi, "\n").replace(/<\/p>|<\/li>|<\/h[1-6]>/gi, "\n")
    .replace(/<[^>]+>/g, "").replace(/&nbsp;/gi, " ").replace(/&amp;/gi, "&")
    .replace(/&#(\d+);/g, (_, code) => String.fromCodePoint(Number(code))).replace(/\n\s*\n\s*\n+/g, "\n\n").trim();
}

function presentationVariants(html) {
  const headings = [...html.matchAll(/<h2\b[^>]*>([\s\S]*?)<\/h2>/gi)];
  const index = headings.findIndex((heading) => /^Apresenta[çc][õo]es/i.test(decodeHtml(heading[1])));
  if (index < 0) return [];
  const start = headings[index].index + headings[index][0].length;
  const end = headings[index + 1]?.index;
  const content = decodeHtml(html.slice(start, end));
  const strengths = [...new Set([...content.matchAll(/\b\d+(?:[,.]\d+)?\s*(?:mg\/mL|mg|mcg|g)\b/gi)]
    .map((match) => match[0].replace(/\s+/g, "").replace(/(mg|mcg|g)$/i, " $1")))];
  const form = [
    "gotas", "comprimido", "cápsula", "xarope", "solução oral", "suspensão oral",
    "creme", "pomada", "spray", "injetável", "ampola", "colírio", "sachê",
  ].find((item) => new RegExp(item, "i").test(content));
  return strengths.map((strength) => ({ strength, form: form || "", label: [strength, form].filter(Boolean).join(" ") }));
}

const state = JSON.parse(await readFile(progressPath, "utf8"));
const pending = state.medicines.filter((medicine) => !medicine.presentationsChecked).slice(0, batchSize);
const results = await Promise.all(pending.map(async (medicine) => {
  const slug = medicine.leafletPath.split("/").at(-1).replace(/\.pdf$/i, "");
  try {
    const response = await fetch(`https://www.drogaraia.com.br/bulas/${slug}`, { signal: AbortSignal.timeout(25000) });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return { medicine, presentations: presentationVariants(await response.text()) };
  } catch {
    return { medicine, presentations: [] };
  }
}));

for (const result of results) {
  result.medicine.presentations = result.presentations;
  result.medicine.presentationsChecked = true;
}

await writeFile(progressPath, JSON.stringify(state, null, 2));
await writeFile(libraryPath, `window.RAIA_MEDICINE_LIBRARY = ${JSON.stringify(state.medicines)};\n`);
console.log(JSON.stringify({ checked: state.medicines.filter((medicine) => medicine.presentationsChecked).length, total: state.medicines.length, variants: state.medicines.filter((medicine) => medicine.presentations?.length > 1).length }, null, 2));
