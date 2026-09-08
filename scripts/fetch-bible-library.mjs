#!/usr/bin/env node
/**
 * Fetch the full Protestant canon for all Living Word free Bible packs
 * plus Matthew Henry commentary (where OpenChristianData has a book).
 *
 * Sources:
 * - kjv: aruljohn/Bible-kjv
 * - asv / web: midvash/bible-data
 * - bsb / bbe / nheb: scrollmapper/bible_databases
 * - commentary: OpenChristianData matthew-henry (CC0)
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { CANON } from "./canon.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const RAW_BIBLE = path.join(ROOT, "data/raw/bible");
const RAW_COMMENTARY = path.join(ROOT, "data/raw/commentary/matthew-henry");

const KJV_BASE =
  "https://raw.githubusercontent.com/aruljohn/Bible-kjv/master";
const MIDVASH_BASE =
  "https://raw.githubusercontent.com/midvash/bible-data/main/versions/en";
const SCROLL_BASE =
  "https://raw.githubusercontent.com/scrollmapper/bible_databases/master/formats/json";
const COMMENTARY_BASE =
  "https://raw.githubusercontent.com/OpenChristianData/open-christian-data/main/data/commentaries/matthew-henry";

const FREE_PACKS = [
  { id: "bsb", file: "BSB.json" },
  { id: "bbe", file: "BBE.json" },
  { id: "nheb", file: "NHEB.json" },
];

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

function toRawBook(versionId, bookName, chapters) {
  return {
    version: versionId,
    book: bookName,
    englishName: bookName,
    chapters: chapters.map((ch) => ({
      chapter: Number(ch.chapter),
      verses: ch.verses.map((v) => ({
        number: Number(v.number ?? v.verse),
        verse: Number(v.verse ?? v.number),
        text: String(v.text ?? "").trim(),
      })),
    })),
  };
}

async function fetchKjv() {
  console.log("Fetching KJV…");
  for (const book of CANON) {
    const raw = await fetchJson(`${KJV_BASE}/${book.aruljohn}.json`);
    const name = raw.book || raw.englishName || book.name;
    const out = toRawBook(
      "kjv",
      book.name,
      raw.chapters.map((ch) => ({
        chapter: ch.chapter,
        verses: (ch.verses || []).map((v) => ({
          number: v.verse ?? v.number,
          verse: v.verse ?? v.number,
          text: v.text,
        })),
      })),
    );
    if (name !== book.name && name.replace(/\s+/g, "") !== book.aruljohn) {
      // Keep canonical English title even if upstream wording differs slightly.
      out.book = book.name;
      out.englishName = book.name;
    }
    writeJson(path.join(RAW_BIBLE, "kjv", `${book.name}.json`), out);
    console.log(`  kjv/${book.slug}: ${out.chapters.length} chapters`);
  }
}

async function fetchMidvash(versionId) {
  console.log(`Fetching ${versionId.toUpperCase()}…`);
  for (const book of CANON) {
    const raw = await fetchJson(
      `${MIDVASH_BASE}/${versionId}/books/${book.midvash}.json`,
    );
    const out = toRawBook(
      versionId,
      book.name,
      raw.chapters.map((ch) => ({
        chapter: ch.chapter,
        verses: (ch.verses || []).map((v) => ({
          number: v.number ?? v.verse,
          verse: v.verse ?? v.number,
          text: v.text,
        })),
      })),
    );
    writeJson(path.join(RAW_BIBLE, versionId, `${book.name}.json`), out);
    console.log(`  ${versionId}/${book.slug}: ${out.chapters.length} chapters`);
  }
}

async function fetchScrollmapperPacks() {
  for (const pack of FREE_PACKS) {
    console.log(`Fetching ${pack.id.toUpperCase()}…`);
    const payload = await fetchJson(`${SCROLL_BASE}/${pack.file}`);
    const byName = new Map(payload.books.map((b) => [b.name, b]));
    for (const book of CANON) {
      const remote = byName.get(book.scrollmapper);
      if (!remote) {
        throw new Error(`${pack.id} missing book ${book.scrollmapper}`);
      }
      const out = toRawBook(
        pack.id,
        book.name,
        remote.chapters.map((ch) => ({
          chapter: ch.chapter,
          verses: (ch.verses || []).map((v) => ({
            number: v.verse ?? v.number,
            verse: v.verse ?? v.number,
            text: v.text,
          })),
        })),
      );
      writeJson(path.join(RAW_BIBLE, pack.id, `${book.name}.json`), out);
      console.log(`  ${pack.id}/${book.slug}: ${out.chapters.length} chapters`);
    }
  }
}

async function fetchCommentary() {
  console.log("Fetching Matthew Henry commentary…");
  for (const book of CANON) {
    if (!book.commentary) {
      console.log(`  skip ${book.slug} (no OpenChristianData pack)`);
      continue;
    }
    const dest = path.join(RAW_COMMENTARY, `${book.commentary}.json`);
    if (fs.existsSync(dest) && fs.statSync(dest).size > 1000) {
      console.log(`  cached ${book.commentary}.json`);
      continue;
    }
    const raw = await fetchJson(`${COMMENTARY_BASE}/${book.commentary}.json`);
    writeJson(dest, raw);
    console.log(
      `  ${book.commentary}.json (${(JSON.stringify(raw).length / 1024).toFixed(0)} KB)`,
    );
  }
}

async function main() {
  await fetchKjv();
  await fetchMidvash("asv");
  await fetchMidvash("web");
  await fetchScrollmapperPacks();
  await fetchCommentary();
  console.log("Done. Run npm run ingest next.");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
