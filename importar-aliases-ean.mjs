import { readFile, writeFile } from "node:fs/promises";

const ROOT = "/Users/mega/Documents/injetaveis/bulas-medicamentos";
const PATHS = {
  source: `${ROOT}/EAN BULAS.rtf`,
  library: `${ROOT}/medicine-library-raia.generated.js`,
  progress: `${ROOT}/importacao-aliases-ean-progresso.json`,
  output: `${ROOT}/ean-medicine-aliases.generated.js`,
  unmatched: `${ROOT}/EANs-sem-associacao-confiavel.txt`,
};

const FORMS = ["comprimido", "cápsula", "capsula", "gotas", "xarope", "solução oral", "solucao oral", "suspensão oral", "suspensao oral", "creme", "pomada", "spray", "injetável", "injetavel", "ampola", "colírio", "colirio", "sachê", "sache"];
const LABS = new Set(["ache", "biolab", "cimed", "donaduzzi", "ems", "eurofarma", "germed", "glenmark", "medley", "neoquimica", "novaquimica", "pharlab", "prati", "ranbaxy", "sandoz", "teuto", "uniao", "uniaoquimica"]);

function normalize(value) {
  return String(value || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLocaleLowerCase("pt-BR").replace(/[^a-z0-9]+/g, " ").trim();
}

function slugFor(medicine) {
  return String(medicine.leafletPath || "").split("/").at(-1).replace(/\.pdf$/i, "").toLocaleLowerCase("pt-BR");
}

function detailsFromTitle(title) {
  const cleaned = String(title || "").replace(/^Bula\s*\|\s*/i, "").trim();
  const strengthMatch = cleaned.match(/\b\d+(?:[,.]\d+)?\s*(?:mg|mcg|g|ui)(?:\s*\/\s*(?:ml|g))?(?:\s*\+\s*\d+(?:[,.]\d+)?\s*(?:mg|mcg|g|ui)(?:\s*\/\s*(?:ml|g))?)*\b/i);
  const strength = strengthMatch?.[0]?.replace(/\s+/g, " ").trim() || "";
  const beforeStrength = strengthMatch ? cleaned.slice(0, strengthMatch.index).trim() : cleaned;
  const normalizedTitle = normalize(cleaned);
  const form = FORMS.find((item) => normalizedTitle.includes(normalize(item))) || "";
  return { name: beforeStrength, strength, form, title: cleaned };
}

function presentationMatches(medicine, strength, form) {
  const presentations = medicine.presentations || [];
  if (!presentations.length) return true;
  const wantedStrength = normalize(strength).replace(/ /g, "");
  const wantedForm = normalize(form);
  return presentations.some((presentation) => {
    const candidateStrength = normalize(presentation.strength || presentation.label).replace(/ /g, "");
    const candidateForm = normalize(presentation.form || presentation.label);
    return (!wantedStrength || candidateStrength.includes(wantedStrength) || wantedStrength.includes(candidateStrength))
      && (!wantedForm || candidateForm.includes(wantedForm));
  });
}

function canonicalMedicineName(value) {
  const tokens = normalize(value).split(" ").filter(Boolean);
  while (tokens.length > 1 && (LABS.has(tokens.at(-1)) || /^\d+(?:mg|mcg|g|ml)$/.test(tokens.at(-1)))) {
    tokens.pop();
  }
  return tokens.join(" ");
}

function findCandidate(medicines, details) {
  const wantedName = normalize(details.name);
  if (wantedName.length < 3) return null;
  const matches = medicines.map((medicine) => {
    const slug = slugFor(medicine);
    const name = canonicalMedicineName(medicine.name);
    const aliases = canonicalMedicineName(medicine.aliases);
    const slugName = canonicalMedicineName(slug.replace(/-/g, " "));
    const exactName = wantedName === name || wantedName === slugName || wantedName === aliases;
    const presentationMatch = presentationMatches(medicine, details.strength, details.form);
    const pediatricVariant = presentationMatch && (
      name === `${wantedName} pediatrico`
      || name === `${wantedName} infantil`
      || slugName === `${wantedName} pediatrico`
      || slugName === `${wantedName} infantil`
    );
    const laboratoryPenalty = LABS.has(slug.split("-").at(-1)) ? 1 : 0;
    const score = exactName ? 100 : pediatricVariant ? 90 : 0;
    return { medicine, slug, score, presentationMatch, laboratoryPenalty };
  }).filter((match) => match.score > 0 && match.presentationMatch)
    .sort((a, b) => b.score - a.score || a.laboratoryPenalty - b.laboratoryPenalty || a.slug.localeCompare(b.slug));
  return matches[0] || null;
}

async function fetchProduct(ean) {
  try {
    const response = await fetch(`https://www.sara.com.br/produto/${ean}`, { redirect: "follow", headers: { "user-agent": "Mozilla/5.0" } });
    if (!response.ok) return { status: "not-found" };
    const html = await response.text();
    const title = html.match(/<title>([^<]+)<\/title>/i)?.[1] || "";
    if (!title || !new RegExp(ean).test(html)) return { status: "not-found" };
    return { status: "found", details: detailsFromTitle(title), sourceUrl: response.url };
  } catch (error) {
    return { status: "error", message: String(error).slice(0, 180) };
  }
}

async function loadState(eans) {
  try { return JSON.parse(await readFile(PATHS.progress, "utf8")); } catch { return { total: eans.length, processed: [], aliases: {}, unmatched: [], errors: [] }; }
}

async function save(state) {
  const aliases = Object.fromEntries(Object.entries(state.aliases).sort(([a], [b]) => a.localeCompare(b)));
  await writeFile(PATHS.progress, JSON.stringify({ ...state, aliases }, null, 2));
  await writeFile(PATHS.output, `window.EAN_MEDICINE_ALIASES = ${JSON.stringify(aliases)};\n`);
  await writeFile(PATHS.unmatched, `${state.unmatched.sort().join("\n")}${state.unmatched.length ? "\n" : ""}`);
}

const requestedBatch = Number(process.argv.find((argument) => argument.startsWith("--batch="))?.split("=")[1] || 20);
const rtf = await readFile(PATHS.source, "utf8");
const eans = [...new Set(rtf.match(/\b\d{13}\b/g) || [])];
const source = await readFile(PATHS.library, "utf8");
const medicines = JSON.parse(source.replace(/^window\.RAIA_MEDICINE_LIBRARY\s*=\s*/, "").replace(/;\s*$/, ""));
const state = await loadState(eans);

if (process.argv.includes("--revalidate")) {
  const validatedAliases = {};
  const unmatched = new Set(state.unmatched || []);
  for (const [ean, alias] of Object.entries(state.aliases || {})) {
    const candidate = findCandidate(medicines, detailsFromTitle(alias.sourceName));
    if (!candidate) {
      unmatched.add(ean);
      continue;
    }
    validatedAliases[ean] = { ...alias, candidateSlug: candidate.slug };
    unmatched.delete(ean);
  }
  state.aliases = validatedAliases;
  state.unmatched = [...unmatched];
  await save(state);
  console.log(JSON.stringify({ revalidated: true, associated: Object.keys(state.aliases).length, unmatched: state.unmatched.length }));
}

const processed = new Set(state.processed);
const batch = eans.filter((ean) => !processed.has(ean)).slice(0, requestedBatch);

for (let index = 0; index < batch.length; index += 72) {
  const group = batch.slice(index, index + 72);
  const results = await Promise.all(group.map(async (ean) => ({ ean, ...(await fetchProduct(ean)) })));
  for (const result of results) {
    state.processed.push(result.ean);
    if (result.status === "error") {
      state.errors.push({ ean: result.ean, message: result.message });
      continue;
    }
    if (result.status !== "found") { state.unmatched.push(result.ean); continue; }
    const candidate = findCandidate(medicines, result.details);
    if (!candidate) { state.unmatched.push(result.ean); continue; }
    state.aliases[result.ean] = { ean: result.ean, candidateSlug: candidate.slug, strength: result.details.strength, form: result.details.form, sourceName: result.details.title, sourceUrl: result.sourceUrl };
  }
  await save(state);
  console.log(JSON.stringify({ total: eans.length, processed: state.processed.length, associated: Object.keys(state.aliases).length, unmatched: state.unmatched.length, errors: state.errors.length }));
}
