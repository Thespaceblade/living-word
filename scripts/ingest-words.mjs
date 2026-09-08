#!/usr/bin/env node
/**
 * Ingest STEPBible morphology (CC BY 4.0) into data/processed/words/{slug}.json
 *
 * Sources: github.com/STEPBible/STEPBible-Data
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { CANON } from "./canon.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");
const RAW = path.join(ROOT, "data/raw/stepbible");
const OUT = path.join(ROOT, "data/processed/words");

const PACKS = [
  {
    lang: "hebrew",
    file: "TAHOT Gen-Deu - Translators Amalgamated Hebrew OT - STEPBible.org CC BY.txt",
    url: "https://raw.githubusercontent.com/STEPBible/STEPBible-Data/master/Translators%20Amalgamated%20OT%2BNT/TAHOT%20Gen-Deu%20-%20Translators%20Amalgamated%20Hebrew%20OT%20-%20STEPBible.org%20CC%20BY.txt",
    codes: ["Gen", "Exo", "Lev", "Num", "Deu"],
  },
  {
    lang: "hebrew",
    file: "TAHOT Jos-Est - Translators Amalgamated Hebrew OT - STEPBible.org CC BY.txt",
    url: "https://raw.githubusercontent.com/STEPBible/STEPBible-Data/master/Translators%20Amalgamated%20OT%2BNT/TAHOT%20Jos-Est%20-%20Translators%20Amalgamated%20Hebrew%20OT%20-%20STEPBible.org%20CC%20BY.txt",
    codes: ["Jos", "Jdg", "Rut", "1Sa", "2Sa", "1Ki", "2Ki", "1Ch", "2Ch", "Ezr", "Neh", "Est"],
  },
  {
    lang: "hebrew",
    file: "TAHOT Job-Sng - Translators Amalgamated Hebrew OT - STEPBible.org CC BY.txt",
    url: "https://raw.githubusercontent.com/STEPBible/STEPBible-Data/master/Translators%20Amalgamated%20OT%2BNT/TAHOT%20Job-Sng%20-%20Translators%20Amalgamated%20Hebrew%20OT%20-%20STEPBible.org%20CC%20BY.txt",
    codes: ["Job", "Psa", "Pro", "Ecc", "Sng"],
  },
  {
    lang: "hebrew",
    file: "TAHOT Isa-Mal - Translators Amalgamated Hebrew OT - STEPBible.org CC BY.txt",
    url: "https://raw.githubusercontent.com/STEPBible/STEPBible-Data/master/Translators%20Amalgamated%20OT%2BNT/TAHOT%20Isa-Mal%20-%20Translators%20Amalgamated%20Hebrew%20OT%20-%20STEPBible.org%20CC%20BY.txt",
    codes: ["Isa", "Jer", "Lam", "Ezk", "Dan", "Hos", "Jol", "Amo", "Oba", "Jon", "Mic", "Nam", "Hab", "Zep", "Hag", "Zec", "Mal"],
  },
  {
    lang: "greek",
    file: "TAGNT Mat-Jhn - Translators Amalgamated Greek NT - STEPBible.org CC-BY.txt",
    url: "https://raw.githubusercontent.com/STEPBible/STEPBible-Data/master/Translators%20Amalgamated%20OT%2BNT/TAGNT%20Mat-Jhn%20-%20Translators%20Amalgamated%20Greek%20NT%20-%20STEPBible.org%20CC-BY.txt",
    codes: ["Mat", "Mrk", "Luk", "Jhn"],
  },
  {
    lang: "greek",
    file: "TAGNT Act-Rev - Translators Amalgamated Greek NT - STEPBible.org CC-BY.txt",
    url: "https://raw.githubusercontent.com/STEPBible/STEPBible-Data/master/Translators%20Amalgamated%20OT%2BNT/TAGNT%20Act-Rev%20-%20Translators%20Amalgamated%20Greek%20NT%20-%20STEPBible.org%20CC-BY.txt",
    codes: ["Act", "Rom", "1Co", "2Co", "Gal", "Eph", "Php", "Col", "1Th", "2Th", "1Ti", "2Ti", "Tit", "Phm", "Heb", "Jas", "1Pe", "2Pe", "1Jn", "2Jn", "3Jn", "Jud", "Rev"],
  },
];

const CODE_TO_SLUG = Object.fromEntries(CANON.map((b) => [b.stepCode, b.slug]));

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
  if (braced) return braced[1];
  const bare = field.match(/(H\d+[A-Za-z]?|G\d+[A-Za-z]?)/);
  return bare ? bare[1] : "";
}

function cleanStrongs(id) {
  const m = id.match(/^([HG])(\d+)([A-Za-z]?)$/);
  if (!m) return id;
  return `${m[1]}${Number(m[2])}`;
}

function parseGreekSurface(cell) {
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
  if (lang === "greek") return /[NnKk]/.test(type);
  return /[LQR]/.test(type);
}

function parsePack(meta, text) {
  /** @type {Record<string, {slug:string,lang:string,chapters:Record<string,Record<string,any[]>>}>} */
  const books = {};
  for (const code of meta.codes) {
    const slug = CODE_TO_SLUG[code];
    if (!slug) continue;
    books[code] = { slug, lang: meta.lang, chapters: {} };
  }

  const bookRe =
    /^([1-3]?[A-Za-z]+)\.(\d+)\.(\d+)(?:\([^)]*\))?#(\d+[a-zA-Z]*)=([A-Za-z0-9()+]+)\t/;

  for (const line of text.split(/\r?\n/)) {
    const match = line.match(bookRe);
    if (!match) continue;
    const code = match[1];
    const book = books[code];
    if (!book) continue;
    const type = match[5];
    if (!shouldKeepType(type, meta.lang)) continue;

    const chapter = Number(match[2]);
    const verse = Number(match[3]);
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
      const dict = cols[4] ?? "";
      const dictGloss = dict.includes("=")
        ? dict.split("=").slice(1).join("=").trim()
        : "";
      if ((!gloss || gloss.startsWith("<")) && dictGloss) gloss = dictGloss;
      strongs = cleanStrongs(
        primaryStrongs(cols[3] ?? "") || primaryStrongs(cols[11] ?? ""),
      );
    } else {
      surface = (cols[1] ?? "").replace(/\\.*$/, "").replace(/\//g, "").trim();
      tlit = normalizeTlit(cols[2] ?? "");
      gloss = (cols[3] ?? "")
        .replace(/[<>[\]]/g, "")
        .replace(/\//g, " ")
        .trim();
      strongs = cleanStrongs(primaryStrongs(cols[4] ?? ""));
    }

    if (!tlit && !surface) continue;

    if (!book.chapters[chapter]) book.chapters[chapter] = {};
    if (!book.chapters[chapter][verse]) book.chapters[chapter][verse] = [];
    book.chapters[chapter][verse].push({
      i: book.chapters[chapter][verse].length + 1,
      surface,
      tlit: tlit || surface,
      strongs,
      gloss,
    });
  }

  return Object.values(books);
}

async function main() {
  fs.mkdirSync(OUT, { recursive: true });
  for (const pack of PACKS) {
    console.log(`Ingesting pack ${pack.file}…`);
    const file = await ensureFile(pack);
    const text = fs.readFileSync(file, "utf8");
    const bundles = parsePack(pack, text);
    for (const book of bundles) {
      const verseCount = Object.values(book.chapters).reduce(
        (n, ch) => n + Object.keys(ch).length,
        0,
      );
      if (verseCount === 0) {
        console.warn(`  skip ${book.slug}: no tokens parsed`);
        continue;
      }
      const payload = {
        slug: book.slug,
        lang: book.lang,
        source: "STEPBible TAGNT/TAHOT",
        license: "CC BY 4.0 - Tyndale House / STEPBible.org",
        attribution:
          "Data created by www.STEPBible.org based on work at Tyndale House Cambridge (CC BY 4.0)",
        chapters: book.chapters,
      };
      const outPath = path.join(OUT, `${book.slug}.json`);
      fs.writeFileSync(outPath, JSON.stringify(payload));
      console.log(
        `  ${book.slug}: ${Object.keys(book.chapters).length} chapters, ${verseCount} verses`,
      );
    }
  }
  console.log("Words ingest done.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
