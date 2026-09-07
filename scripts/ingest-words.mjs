#!/usr/bin/env node
/**
 * Ingest STEPBible morphology (CC BY 4.0) for Genesis, Psalms, John
 * into data/processed/words/{slug}.json
 *
 * Sources: github.com/STEPBible/STEPBible-Data
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");
const RAW = path.join(ROOT, "data/raw/stepbible");
const OUT = path.join(ROOT, "data/processed/words");

const SOURCES = {
  genesis: {
    lang: "hebrew",
    file: "TAHOT Gen-Deu - Translators Amalgamated Hebrew OT - STEPBible.org CC BY.txt",
    url: "https://raw.githubusercontent.com/STEPBible/STEPBible-Data/master/Translators%20Amalgamated%20OT%2BNT/TAHOT%20Gen-Deu%20-%20Translators%20Amalgamated%20Hebrew%20OT%20-%20STEPBible.org%20CC%20BY.txt",
    bookCode: "Gen",
  },
  psalms: {
    lang: "hebrew",
    file: "TAHOT Job-Sng - Translators Amalgamated Hebrew OT - STEPBible.org CC BY.txt",
    url: "https://raw.githubusercontent.com/STEPBible/STEPBible-Data/master/Translators%20Amalgamated%20OT%2BNT/TAHOT%20Job-Sng%20-%20Translators%20Amalgamated%20Hebrew%20OT%20-%20STEPBible.org%20CC%20BY.txt",
    bookCode: "Psa",
  },
  john: {
    lang: "greek",
    file: "TAGNT Mat-Jhn - Translators Amalgamated Greek NT - STEPBible.org CC-BY.txt",
    url: "https://raw.githubusercontent.com/STEPBible/STEPBible-Data/master/Translators%20Amalgamated%20OT%2BNT/TAGNT%20Mat-Jhn%20-%20Translators%20Amalgamated%20Greek%20NT%20-%20STEPBible.org%20CC-BY.txt",
    bookCode: "Jhn",
  },
};

async function ensureFile(meta) {
  fs.mkdirSync(RAW, { recursive: true });
  const dest = path.join(RAW, meta.file);
  if (fs.existsSync(dest) && fs.statSync(dest).size > 100_000) {
    console.log(`  using cached ${meta.file}`);
    return dest;
  }
  console.log(`  downloading ${meta.file}…`);
  const res = await fetch(meta.url);
  if (!res.ok) throw new Error(`Failed ${meta.url}: ${res.status}`);
  const text = await res.text();
  fs.writeFileSync(dest, text);
  return dest;
}

function normalizeTlit(raw) {
  return raw
    .replace(/\./g, "")
    .replace(/\//g, "-")
    .replace(/\s+/g, " ")
    .trim();
}

function primaryStrongs(field) {
  if (!field) return "";
  const braced = field.match(/\{(H\d+[A-Za-z]?|G\d+[A-Za-z]?)\}/);
  if (braced) return braced[1].replace(/[A-Za-z]$/, (m) => m); // keep disambig letter briefly
  const bare = field.match(/(H\d+[A-Za-z]?|G\d+[A-Za-z]?)/);
  return bare ? bare[1] : "";
}

function cleanStrongs(id) {
  // Display as H7225 / G3779 (strip trailing disambiguation letter for UI)
  const m = id.match(/^([HG])(\d+)([A-Za-z]?)$/);
  if (!m) return id;
  return `${m[1]}${Number(m[2])}`;
}

function parseGreekSurface(cell) {
  // οὕτως (houtōs)  or  κόσμον, (kosmon)
  const m = cell.match(/^(.+?)\s*\(([^)]+)\)\s*$/);
  if (m) {
    return {
      surface: m[1].replace(/[,;.]$/, "").trim(),
      tlit: m[2].trim(),
    };
  }
  return { surface: cell.trim(), tlit: "" };
}

function shouldKeepType(type, lang) {
  if (lang === "greek") {
    // Keep NA and/or traditional (KJV) readings; skip other-only variants
    return /[NnKk]/.test(type);
  }
  // Leningrad main text, Qere, or restored passages
  return /[LQR]/.test(type);
}

function parseBookFile(slug, meta, text) {
  const chapters = {};
  const bookRe = new RegExp(
    `^${meta.bookCode}\\.(\\d+)\\.(\\d+)(?:\\([^)]*\\))?#(\\d+[a-zA-Z]*)=([A-Za-z0-9()+]+)\\t`,
  );

  for (const line of text.split(/\r?\n/)) {
    const match = line.match(bookRe);
    if (!match) continue;
    const type = match[4];
    if (!shouldKeepType(type, meta.lang)) continue;

    const chapter = Number(match[1]);
    const verse = Number(match[2]);
    if (!Number.isFinite(chapter) || !Number.isFinite(verse) || verse < 1) {
      continue;
    }
    const cols = line.split("\t");

    let surface = "";
    let tlit = "";
    let gloss = "";
    let strongs = "";

    if (meta.lang === "greek") {
      const parsed = parseGreekSurface(cols[1] ?? "");
      surface = parsed.surface;
      tlit = parsed.tlit;
      gloss = (cols[2] ?? "").replace(/[<>[\]]/g, "").trim();
      // Prefer short gloss from dictionary form column if English is sparse
      const dict = cols[4] ?? "";
      const dictGloss = dict.includes("=") ? dict.split("=").slice(1).join("=").trim() : "";
      if ((!gloss || gloss.startsWith("<")) && dictGloss) gloss = dictGloss;
      strongs = cleanStrongs(primaryStrongs(cols[3] ?? "") || primaryStrongs(cols[11] ?? ""));
    } else {
      surface = (cols[1] ?? "").replace(/\\.*$/, "").replace(/\//g, "").trim();
      tlit = normalizeTlit(cols[2] ?? "");
      gloss = (cols[3] ?? "").replace(/[<>[\]]/g, "").replace(/\//g, " ").trim();
      strongs = cleanStrongs(primaryStrongs(cols[4] ?? ""));
    }

    if (!tlit && !surface) continue;

    if (!chapters[chapter]) chapters[chapter] = {};
    if (!chapters[chapter][verse]) chapters[chapter][verse] = [];
    chapters[chapter][verse].push({
      i: chapters[chapter][verse].length + 1,
      surface,
      tlit: tlit || surface,
      strongs,
      gloss,
    });
  }

  return {
    slug,
    lang: meta.lang,
    source: "STEPBible TAGNT/TAHOT",
    license: "CC BY 4.0 - Tyndale House / STEPBible.org",
    attribution: "Data created by www.STEPBible.org based on work at Tyndale House Cambridge (CC BY 4.0)",
    chapters,
  };
}

async function main() {
  fs.mkdirSync(OUT, { recursive: true });
  for (const [slug, meta] of Object.entries(SOURCES)) {
    console.log(`Ingesting words for ${slug}…`);
    const file = await ensureFile(meta);
    const text = fs.readFileSync(file, "utf8");
    const bundle = parseBookFile(slug, meta, text);
    const verseCount = Object.values(bundle.chapters).reduce(
      (n, ch) => n + Object.keys(ch).length,
      0,
    );
    const outPath = path.join(OUT, `${slug}.json`);
    fs.writeFileSync(outPath, JSON.stringify(bundle));
    console.log(
      `  ${Object.keys(bundle.chapters).length} chapters, ${verseCount} verses → ${outPath}`,
    );
  }
  console.log("Words ingest done.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
