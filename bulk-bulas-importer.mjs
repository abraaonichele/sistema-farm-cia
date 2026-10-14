import { readFile, writeFile } from "node:fs/promises";

const ROOT = "/Users/mega/Documents/injetaveis/bulas-medicamentos";
const PATHS = {
  source: `${ROOT}/EAN BULAS.rtf`,
  progress: `${ROOT}/importacao-bulas-progresso.json`,
  library: `${ROOT}/medicine-library.generated.js`,
  missing: `${ROOT}/EANs-nao-encontrados.txt`,
  partial: `${ROOT}/EANs-com-bula-incompleta.txt`,
};

const TOPICS = {
  "Como funciona": /^Como .* funciona\?/i,
  "Como usar": /^Como usar /i,
  "Contraindicações": /contraindica/i,
  "Interação medicamentosa": /^Interação medicamentosa/i,
};

export async function createBulkBulasImporter(browser) {
  const rtf = await readFile(PATHS.source, "utf8");
  const eans = [...new Set(rtf.match(/\b\d{13}\b/g) || [])];
  const state = JSON.parse(await readFile(PATHS.progress, "utf8"));

  async function lookup(ean) {
    const tab = await browser.tabs.new();
    try {
      await tab.goto(`https://consultaremedios.com.br/b/${ean}`);
      await tab.playwright.waitForLoadState({ state: "domcontentloaded", timeoutMs: 30000 }).catch(() => {});
      const productUrl = await tab.playwright.evaluate(() => [...document.querySelectorAll("a")].find((link) => link.querySelector("h2"))?.href || "");
      if (!productUrl) return { ean, status: "missing" };

      await tab.goto(productUrl);
      await tab.playwright.waitForLoadState({ state: "domcontentloaded", timeoutMs: 30000 }).catch(() => {});
      const sections = [];
      for (const [title, pattern] of Object.entries(TOPICS)) {
        const detail = tab.playwright.locator("details").filter({ hasText: pattern }).first();
        if (await detail.count() === 0) continue;
        if ((await detail.getAttribute("open")) === null) await detail.locator("summary").click();
        sections.push({ title, content: (await detail.innerText()).replace(/^[^\n]*(?:\n|$)/, "").trim() });
      }

      const name = await tab.playwright.locator("h1").first().innerText();
      const sourceLeaflet = await tab.playwright.locator("a").filter({ hasText: /Bula do Profissional/i }).first().getAttribute("href").catch(() => null);
      return { ean, status: sections.length === 4 && sourceLeaflet ? "found" : "partial", medicine: { name, ean, aliases: name.toLocaleLowerCase("pt-BR"), leafletPath: sourceLeaflet, sourceLeaflet, sections } };
    } catch (error) {
      return { ean, status: "error", message: String(error).slice(0, 160) };
    } finally {
      await tab.close().catch(() => {});
    }
  }

  async function save() {
    state.medicines.sort((a, b) => a.ean.localeCompare(b.ean));
    state.missing.sort();
    state.partial.sort((a, b) => a.ean.localeCompare(b.ean));
    state.errors.sort((a, b) => a.ean.localeCompare(b.ean));
    state.processed = [...new Set(state.processed)].sort();
    await writeFile(PATHS.progress, JSON.stringify(state, null, 2));
    await writeFile(PATHS.library, `window.MEDICINE_LIBRARY = ${JSON.stringify(state.medicines)};\n`);
    await writeFile(PATHS.missing, `${state.missing.join("\n")}${state.missing.length ? "\n" : ""}`);
    await writeFile(PATHS.partial, `${state.partial.map((item) => `${item.ean}\t${item.name || ""}`).join("\n")}${state.partial.length ? "\n" : ""}`);
  }

  return async function runBatch(size = 12) {
    const processed = new Set(state.processed);
    const errors = new Set(state.errors.map((item) => item.ean));
    const pending = eans.filter((ean) => !processed.has(ean) && !errors.has(ean));
    const candidates = (pending.length ? pending : eans.filter((ean) => !processed.has(ean))).slice(0, size);
    const results = await Promise.all(candidates.map(lookup));

    for (const result of results) {
      state.errors = state.errors.filter((item) => item.ean !== result.ean);
      if (result.status === "error") {
        state.errors.push({ ean: result.ean, message: result.message });
        continue;
      }
      state.processed.push(result.ean);
      state.medicines = state.medicines.filter((item) => item.ean !== result.ean);
      state.missing = state.missing.filter((item) => item !== result.ean);
      state.partial = state.partial.filter((item) => item.ean !== result.ean);
      if (result.status === "found") state.medicines.push(result.medicine);
      if (result.status === "missing") state.missing.push(result.ean);
      if (result.status === "partial") state.partial.push({ ean: result.ean, name: result.medicine?.name || "" });
    }

    await save();
    return { total: eans.length, processed: state.processed.length, found: state.medicines.length, missing: state.missing.length, partial: state.partial.length, errors: state.errors.length };
  };
}
