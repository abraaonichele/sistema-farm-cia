import { mkdir, readFile, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { spawn } from "node:child_process";
import { once } from "node:events";

if (process.argv.includes("--until-complete")) {
  const childArgs = process.argv.slice(2).filter((argument) => argument !== "--until-complete");
  const requestedLetters = new Set((childArgs.find((argument) => argument.startsWith("--letters="))?.split("=")[1] || "bcdefghijklmnopqrstuvwxyz")
    .toLocaleLowerCase("pt-BR")
    .replace(/[^a-z]/g, ""));

  while (true) {
    const child = spawn(process.execPath, [new URL(import.meta.url).pathname, ...childArgs], { stdio: "inherit" });
    const [exitCode] = await once(child, "close");
    if (exitCode !== 0) process.exit(exitCode || 1);

    const state = JSON.parse(await readFile("/Users/mega/Documents/injetaveis/bulas-medicamentos/importacao-bulas-raia-progresso.json", "utf8"));
    const processed = new Set(state.processed);
    const errors = new Set(state.errors.map((item) => item.url));
    const remaining = state.urls.some((url) => (
      requestedLetters.has(new URL(url).pathname.split("/").at(-1).charAt(0).toLocaleLowerCase("pt-BR"))
      && !processed.has(url)
      && !errors.has(url)
    ));
    if (!remaining) break;
  }
  process.exit(0);
}

const ROOT = "/Users/mega/Documents/injetaveis/bulas-medicamentos";
const PDF_DIR = `${ROOT}/raia-pdfs`;
const PATHS = {
  progress: `${ROOT}/importacao-bulas-raia-progresso.json`,
  library: `${ROOT}/medicine-library-raia.generated.js`,
  missing: `${ROOT}/bulas-raia-nao-encontradas.txt`,
  incomplete: `${ROOT}/bulas-raia-incompletas.txt`,
};
const ORIGIN = "https://www.drogaraia.com.br";
const DEFAULT_LETTERS = "bcdefghijklmnopqrstuvwxyz";

function decodeHtml(value = "") {
  return value
    .replace(/<br\s*\/?/gi, "\n")
    .replace(/<\/p>|<\/li>|<\/h[1-6]>|<\/tr>/gi, "\n")
    .replace(/<li\b[^>]*>/gi, "- ")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&#(\d+);/g, (_, code) => String.fromCodePoint(Number(code)))
    .replace(/&#x([0-9a-f]+);/gi, (_, code) => String.fromCodePoint(parseInt(code, 16)))
    .replace(/\n[ \t]*\n[ \t]*\n+/g, "\n\n")
    .replace(/[ \t]+\n/g, "\n")
    .trim();
}

function headings(html, level) {
  return [...html.matchAll(new RegExp(`<h${level}\\b[^>]*>([\\s\\S]*?)<\\/h${level}>`, "gi"))]
    .map((match) => ({ text: decodeHtml(match[1]), start: match.index, end: match.index + match[0].length }));
}

function sectionAfterHeading(html, matcher) {
  const matches = headings(html, 2);
  const heading = matches.find((item) => matcher.test(item.text));
  if (!heading) return "";
  const next = matches.find((item) => item.start > heading.start);
  return html.slice(heading.end, next?.start);
}

function extractUse(html) {
  return sectionAfterHeading(html, /^Como devo usar /i);
}

function extractInteraction(html) {
  const source = sectionAfterHeading(html, /^O que (?:preciso|devo) saber antes de usar /i);
  const h3s = headings(source, 3);
  const interaction = h3s.find((item) => /intera(?:ção|ções).*medicament/i.test(item.text));
  if (!interaction) return source;
  const next = h3s.find((item) => item.start > interaction.start);
  return source.slice(interaction.end, next?.start);
}

function blocksFromHtml(html) {
  const matches = [...html.matchAll(/<h[3-6]\b[^>]*>([\s\S]*?)<\/h[3-6]>/gi)];
  const blocks = [];
  let cursor = 0;

  for (const match of matches) {
    const text = decodeHtml(html.slice(cursor, match.index));
    if (text) blocks.push({ type: "text", content: text });
    const heading = decodeHtml(match[1]);
    if (heading) blocks.push({ type: "heading", content: heading });
    cursor = match.index + match[0].length;
  }

  const trailingText = decodeHtml(html.slice(cursor));
  if (trailingText) blocks.push({ type: "text", content: trailingText });
  return blocks;
}

function strengthsFromPresentation(html) {
  const presentation = decodeHtml(sectionAfterHeading(html, /^Apresenta[çc][õo]es/i));
  return [...new Set([...presentation.matchAll(/\b\d+(?:[,.]\d+)?\s*mg\b/gi)]
    .map((match) => match[0].replace(/\s+/g, "").replace(/mg$/i, " mg")))];
}

function slugFromUrl(url) {
  return new URL(url).pathname.split("/").filter(Boolean).at(-1).replace(/[^a-z0-9-]+/gi, "-").toLowerCase();
}

async function fetchResponse(url) {
  const response = await fetch(url, {
    signal: AbortSignal.timeout(25000),
    headers: {
      "user-agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/131 Safari/537.36",
      accept: "text/html,application/pdf;q=0.9,*/*;q=0.8",
    },
  });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  return response;
}

async function fetchText(url) {
  return (await fetchResponse(url)).text();
}

function getListingUrls(html) {
  return [...new Set([...html.matchAll(/href=["'](?:https?:\/\/www\.drogaraia\.com\.br)?(\/bulas\/(?!letra\b)[a-z0-9-]+)["']/gi)]
    .map((match) => `${ORIGIN}${match[1]}`))];
}

function medicineFromHtml(url, html, leafletUrl) {
  const heading = headings(html, 1).find((item) => /^Bula do /i.test(item.text));
  const name = (heading?.text || slugFromUrl(url)).replace(/^Bula do /i, "").trim();
  const sections = [
    { title: "Como funciona", content: decodeHtml(sectionAfterHeading(html, /^Como .* funciona\?$/i)) },
    { title: "Como usar", blocks: blocksFromHtml(extractUse(html)) },
    { title: "Contraindicações", content: decodeHtml(sectionAfterHeading(html, /^Quando\b.*?n[aã]o (?:deve(?: ser)? usado|devo usar).*\?$/i)) },
    { title: "Interação medicamentosa", blocks: blocksFromHtml(extractInteraction(html)) },
  ];
  return {
    name,
    ean: "",
    aliases: `${name} ${slugFromUrl(url)}`.toLocaleLowerCase("pt-BR"),
    source: "Droga Raia",
    sourceLeaflet: leafletUrl,
    leafletPath: `./bulas-medicamentos/raia-pdfs/${slugFromUrl(url)}.pdf`,
    strengths: strengthsFromPresentation(html),
    sections,
  };
}

async function readState() {
  try {
    return JSON.parse(await readFile(PATHS.progress, "utf8"));
  } catch {
    return { urls: [], processed: [], medicines: [], missing: [], incomplete: [], errors: [] };
  }
}

async function writeState(state) {
  state.urls = [...new Set(state.urls)].sort();
  state.processed = [...new Set(state.processed)].sort();
  state.medicines.sort((a, b) => a.name.localeCompare(b.name, "pt-BR"));
  state.missing = [...new Set(state.missing)].sort();
  state.incomplete = [...new Set(state.incomplete)].sort();
  state.errors.sort((a, b) => a.url.localeCompare(b.url));
  await mkdir(PDF_DIR, { recursive: true });
  await writeFile(PATHS.progress, JSON.stringify(state, null, 2));
  await writeFile(PATHS.library, `window.RAIA_MEDICINE_LIBRARY = ${JSON.stringify(state.medicines)};\n`);
  await writeFile(PATHS.missing, `${state.missing.join("\n")}${state.missing.length ? "\n" : ""}`);
  await writeFile(PATHS.incomplete, `${state.incomplete.join("\n")}${state.incomplete.length ? "\n" : ""}`);
}

async function mapLimit(items, limit, mapper) {
  const results = [];
  let cursor = 0;
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (cursor < items.length) {
      const index = cursor++;
      results[index] = await mapper(items[index]);
    }
  }));
  return results;
}

function listingPageCount(html, letter) {
  const matches = [...html.matchAll(new RegExp(`/bulas/letra/${letter}\\?p=(\\d+)`, "gi"))]
    .map((match) => Number(match[1]));
  return Math.max(1, ...matches);
}

async function collectUrls(state, letters) {
  const firstPages = await mapLimit([...letters], 5, async (letter) => {
    try {
      const html = await fetchText(`${ORIGIN}/bulas/letra/${letter}`);
      return { letter, urls: getListingUrls(html), pageCount: listingPageCount(html, letter) };
    } catch {
      return { letter, urls: [], pageCount: 0 };
    }
  });
  const remainingPages = firstPages.flatMap(({ letter, pageCount }) => (
    Array.from({ length: pageCount - 1 }, (_, index) => `${ORIGIN}/bulas/letra/${letter}?p=${index + 2}`)
  ));
  const listings = await mapLimit(remainingPages, 5, async (url) => {
    try {
      return getListingUrls(await fetchText(url));
    } catch {
      return [];
    }
  });
  state.urls = [...new Set([...state.urls, ...firstPages.flatMap((item) => item.urls), ...listings.flat()])];
}

async function downloadLeaflet(url, destination) {
  if (existsSync(destination)) return;
  const response = await fetchResponse(url);
  await writeFile(destination, Buffer.from(await response.arrayBuffer()));
}

async function processMedicine(url) {
  const html = await fetchText(url);
  const leafletUrl = [...html.matchAll(/href=["']([^"']+\.pdf(?:\?[^"']*)?)["'][^>]*>\s*(?:<[^>]+>\s*)*Ler a Bula em PDF/gi)]
    .map((match) => match[1])
    .find(Boolean);
  if (!leafletUrl) return { url, status: "missing" };
  const medicine = medicineFromHtml(url, html, leafletUrl);
  const hasAllSections = medicine.sections.every((section) => section.content || section.blocks?.some((block) => block.content));
  const destination = `${PDF_DIR}/${slugFromUrl(url)}.pdf`;
  await downloadLeaflet(leafletUrl, destination);
  return { url, status: hasAllSections ? "found" : "incomplete", medicine };
}

const batchSize = Math.max(1, Number(process.argv.find((argument) => argument.startsWith("--batch="))?.split("=")[1] || 12));
const letters = (process.argv.find((argument) => argument.startsWith("--letters="))?.split("=")[1] || DEFAULT_LETTERS)
  .toLocaleLowerCase("pt-BR")
  .replace(/[^a-z]/g, "");
const requestedLetters = new Set(letters);
const state = await readState();
if (process.argv.includes("--retry-incomplete")) {
  const retryUrls = new Set(state.incomplete);
  state.processed = state.processed.filter((url) => !retryUrls.has(url));
  state.incomplete = [];
}
if (process.argv.includes("--retry-errors")) {
  state.errors = state.errors.filter((item) => !requestedLetters.has(new URL(item.url).pathname.split("/").at(-1).charAt(0).toLocaleLowerCase("pt-BR")));
}
if (!process.argv.includes("--skip-discovery")) {
  await collectUrls(state, letters);
}
const processed = new Set(state.processed);
const failed = new Set(state.errors.map((item) => item.url));
const pending = state.urls
  .filter((url) => requestedLetters.has(new URL(url).pathname.split("/").at(-1).charAt(0).toLocaleLowerCase("pt-BR")))
  .filter((url) => !processed.has(url) && !failed.has(url))
  .slice(0, batchSize);
const results = await mapLimit(pending, 5, async (url) => {
  try {
    return await processMedicine(url);
  } catch (error) {
    return { url, status: "error", message: String(error).slice(0, 180) };
  }
});

for (const result of results) {
  state.errors = state.errors.filter((item) => item.url !== result.url);
  if (result.status === "error") {
    state.errors.push({ url: result.url, message: result.message });
    continue;
  }
  state.processed.push(result.url);
  state.medicines = state.medicines.filter((item) => item.sourceLeaflet !== result.medicine?.sourceLeaflet);
  state.missing = state.missing.filter((url) => url !== result.url);
  state.incomplete = state.incomplete.filter((url) => url !== result.url);
  if (result.status === "found") state.medicines.push(result.medicine);
  if (result.status === "missing") state.missing.push(result.url);
  if (result.status === "incomplete") state.incomplete.push(result.url);
}

await writeState(state);
console.log(JSON.stringify({ total: state.urls.length, processed: state.processed.length, found: state.medicines.length, missing: state.missing.length, incomplete: state.incomplete.length, errors: state.errors.length, pending: state.urls.length - state.processed.length }, null, 2));
