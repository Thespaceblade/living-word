#!/usr/bin/env node
/**
 * Convert Open Scriptures Strong's dictionaries (CC BY-SA) into
 * data/processed/lexicon/{hebrew,greek}.json for runtime lookups.
 *
 * Source: https://github.com/openscriptures/strongs
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const RAW = path.join(ROOT, "data/raw/strongs");
const OUT = path.join(ROOT, "data/processed/lexicon");

const SOURCES = [
  {
    id: "greek",
    file: "strongs-greek-dictionary.js",
    url: "https://raw.githubusercontent.com/openscriptures/strongs/master/greek/strongs-greek-dictionary.js",
    lang: "greek",
  },
  {
    id: "hebrew",
    file: "strongs-hebrew-dictionary.js",
    url: "https://raw.githubusercontent.com/openscriptures/strongs/master/hebrew/strongs-hebrew-dictionary.js",
    lang: "hebrew",
  },
];

async function ensureFile(meta) {
  fs.mkdirSync(RAW, { recursive: true });
  const dest = path.join(RAW, meta.file);
  if (fs.existsSync(dest) && fs.statSync(dest).size > 50_000) {
    console.log(`  using cached ${meta.file}`);
    return dest;
  }
  console.log(`  downloading ${meta.file}…`);
  const res = await fetch(meta.url);
  if (!res.ok) throw new Error(`Failed ${meta.url}: ${res.status}`);
  fs.writeFileSync(dest, await res.text());
  return dest;
}

function parseDictionaryJs(text) {
  const match = text.match(/var\s+(\w+)\s*=\s*/);
  if (!match || match.index == null) {
    throw new Error("Could not find dictionary assignment");
  }
  const name = match[1];
  const start = match.index + match[0].length;
  const brace = text.indexOf("{", start);
  if (brace < 0) throw new Error("Could not find dictionary object");

  let depth = 0;
  let end = -1;
  let inString = false;
  let escape = false;
  for (let i = brace; i < text.length; i += 1) {
    const ch = text[i];
    if (inString) {
      if (escape) {
        escape = false;
        continue;
      }
      if (ch === "\\") {
        escape = true;
        continue;
      }
      if (ch === '"') inString = false;
      continue;
    }
    if (ch === '"') {
      inString = true;
      continue;
    }
    if (ch === "{") depth += 1;
    else if (ch === "}") {
      depth -= 1;
      if (depth === 0) {
        end = i;
        break;
      }
    }
  }
  if (end < 0) throw new Error("Unbalanced dictionary braces");
  const objectLiteral = text.slice(brace, end + 1);
  // Open Scriptures files are JS object literals (not always strict JSON).
  // eslint-disable-next-line no-new-func
  const fn = new Function(`${name} = ${objectLiteral}; return ${name};`);
  return fn();
}

function normalizeEntry(id, raw) {
  return {
    id,
    lemma: raw.lemma ?? "",
    translit: raw.translit ?? raw.xlit ?? "",
    pronunciation: raw.pron ?? "",
    derivation: raw.derivation ?? "",
    strongsDef: String(raw.strongs_def ?? "")
      .replace(/^\{|\}$/g, "")
      .trim(),
    kjvDef: String(raw.kjv_def ?? "").trim(),
  };
}

async function main() {
  fs.mkdirSync(OUT, { recursive: true });
  const index = {};

  for (const source of SOURCES) {
    console.log(`Ingesting ${source.id} lexicon…`);
    const file = await ensureFile(source);
    const raw = parseDictionaryJs(fs.readFileSync(file, "utf8"));
    const entries = {};
    for (const [id, value] of Object.entries(raw)) {
      const key = id.toUpperCase();
      entries[key] = normalizeEntry(key, value);
      index[key] = source.lang;
    }
    const outPath = path.join(OUT, `${source.id}.json`);
    fs.writeFileSync(
      outPath,
      JSON.stringify({
        lang: source.lang,
        source: "Open Scriptures Strong's",
        license: "CC BY-SA",
        attribution:
          "Strong's Exhaustive Concordance via Open Scriptures (CC BY-SA)",
        entries,
      }),
    );
    console.log(`  ${Object.keys(entries).length} entries → ${outPath}`);
  }

  fs.writeFileSync(path.join(OUT, "index.json"), JSON.stringify({ ids: index }));
  console.log("Lexicon ingest done.");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
