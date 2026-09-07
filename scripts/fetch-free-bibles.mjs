#!/usr/bin/env node
/**
 * Fetch free modern public-domain English Bibles (BSB, BBE, NHEB)
 * for the books Living Word currently ships, into data/raw/bible/.
 *
 * Source: scrollmapper/bible_databases (public domain / CC0 texts).
 * NIV / ESV / NKJV are copyrighted and are intentionally not included.
 * OEB is skipped because its OT books are empty in that dataset.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const OUT = path.join(ROOT, "data/raw/bible");

const SOURCE_BASE =
  "https://raw.githubusercontent.com/scrollmapper/bible_databases/master/formats/json";

const VERSIONS = [
  {
    id: "bsb",
    file: "BSB.json",
    label: "BSB",
    name: "Berean Standard Bible",
  },
  {
    id: "bbe",
    file: "BBE.json",
    label: "BBE",
    name: "Bible in Basic English",
  },
  {
    id: "nheb",
    file: "NHEB.json",
    label: "NHEB",
    name: "New Heart English Bible",
  },
];

const BOOKS = ["Genesis", "Psalms", "John"];

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function writeJson(file, data) {
  ensureDir(path.dirname(file));
  fs.writeFileSync(file, JSON.stringify(data, null, 2));
}

async function fetchJson(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed ${res.status} for ${url}`);
  return res.json();
}

function toRawBook(versionId, book) {
  return {
    version: versionId,
    book: book.name,
    englishName: book.name,
    chapters: book.chapters.map((ch) => ({
      chapter: Number(ch.chapter),
      verses: ch.verses.map((v) => ({
        number: Number(v.verse),
        verse: Number(v.verse),
        text: String(v.text).trim(),
      })),
    })),
  };
}

async function main() {
  for (const version of VERSIONS) {
    console.log(`Fetching ${version.name}…`);
    const payload = await fetchJson(`${SOURCE_BASE}/${version.file}`);
    const byName = new Map(payload.books.map((b) => [b.name, b]));

    for (const bookName of BOOKS) {
      const book = byName.get(bookName);
      if (!book) {
        throw new Error(`${version.id} missing book ${bookName}`);
      }
      const out = path.join(OUT, version.id, `${bookName}.json`);
      writeJson(out, toRawBook(version.id, book));
      console.log(
        `  ${version.id}/${bookName}: ${book.chapters.length} chapters`,
      );
    }
  }
  console.log("Done. Run npm run ingest to process.");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
