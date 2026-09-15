#!/usr/bin/env node
/**
 * Tag Tyndale Open Study Notes onto verse keys and write
 * data/processed/commentary/{slug}.json (+ catalog commentary fields).
 *
 * Notes are attached to the verse where Tyndale placed them in the API
 * (api_verse), matching study-Bible footnote behavior.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { CANON, VERSIONS } from "./canon.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const RAW = path.join(ROOT, "data/raw/commentary/tyndale-open-study-notes");
const OUT = path.join(ROOT, "data/processed");

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function writeJson(file, data) {
  ensureDir(path.dirname(file));
  fs.writeFileSync(file, JSON.stringify(data));
}

function verseKey(book, chapter, verse) {
  return `${book}.${chapter}.${verse}`;
}

function loadRaw(slug) {
  const file = path.join(RAW, `${slug}.json`);
  if (!fs.existsSync(file)) return null;
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

function buildBundle(book) {
  const raw = loadRaw(book.slug);
  const meta = {
    id: "tyndale-open-study-notes",
    title: "Tyndale Open Study Notes",
    author: "Tyndale House Publishers",
    license: "cc-by-sa-4.0",
    source: "tyndaleopenresources.com",
    website: "https://tyndaleopenresources.com/",
    licenseUrl: "https://creativecommons.org/licenses/by-sa/4.0/",
  };

  if (!raw) {
    return {
      book: book.name,
      slug: book.slug,
      meta,
      bookIntroId: null,
      byChapterIntro: {},
      byVerse: {},
      entries: {},
      _counts: { entries: 0, taggedVerses: 0 },
    };
  }

  const entries = {};
  const byVerse = {};
  let bookIntroId = null;

  if (raw.introduction?.trim()) {
    bookIntroId = `tyndale-open-study-notes.${book.name}.intro`;
    entries[bookIntroId] = {
      id: bookIntroId,
      source: meta.id,
      author: meta.author,
      chapter: 0,
      verseRange: "intro",
      verses: [],
      crossReferences: [],
      wordCount: raw.introduction.trim().split(/\s+/).length,
      excerpt: raw.introduction.trim().slice(0, 280).replace(/\s+/g, " "),
      text: raw.introduction.trim(),
    };
  }

  for (const item of raw.data ?? []) {
    const text = String(item.commentary_text ?? "").trim();
    if (!text) continue;
    const chapter = Number(item.chapter);
    const apiVerse = Number(item.api_verse ?? item.verses?.[0]);
    if (!Number.isFinite(chapter) || !Number.isFinite(apiVerse)) continue;

    const id = item.entry_id;
    entries[id] = {
      id,
      source: meta.id,
      author: meta.author,
      chapter,
      verseRange: item.verse_range ?? String(apiVerse),
      verses: Array.isArray(item.verses) && item.verses.length
        ? item.verses
        : [apiVerse],
      crossReferences: [],
      wordCount: item.word_count ?? text.split(/\s+/).filter(Boolean).length,
      excerpt: text.slice(0, 280).replace(/\s+/g, " ").trim(),
      text,
    };

    const key = verseKey(book.name, chapter, apiVerse);
    byVerse[key] ??= [];
    byVerse[key].push(id);
  }

  return {
    book: book.name,
    slug: book.slug,
    meta,
    bookIntroId,
    byChapterIntro: {},
    byVerse,
    entries,
    _counts: {
      entries: Object.keys(entries).length,
      taggedVerses: Object.keys(byVerse).length,
    },
  };
}

function main() {
  if (!fs.existsSync(RAW)) {
    console.error(
      "Missing Tyndale raw data. Run: node scripts/fetch-tyndale.mjs",
    );
    process.exit(1);
  }

  ensureDir(path.join(OUT, "commentary"));
  const catalogPath = path.join(OUT, "catalog.json");
  const catalog = fs.existsSync(catalogPath)
    ? JSON.parse(fs.readFileSync(catalogPath, "utf8"))
    : { versions: VERSIONS, books: [], generatedAt: null };

  const books = [];
  for (const book of CANON) {
    const bundle = buildBundle(book);
    const { _counts, ...runtime } = bundle;
    writeJson(path.join(OUT, "commentary", `${book.slug}.json`), runtime);
    books.push({
      book: book.name,
      slug: book.slug,
      chapters: book.chapters,
      commentaryEntries: _counts.entries,
      taggedVerses: _counts.taggedVerses,
      license: runtime.meta.license,
      author: runtime.meta.author,
    });
    console.log(
      `${book.slug}: ${_counts.entries} notes, ${_counts.taggedVerses} verses`,
    );
  }

  writeJson(catalogPath, {
    ...catalog,
    versions: catalog.versions?.length ? catalog.versions : VERSIONS,
    books,
    generatedAt: new Date().toISOString(),
    commentary: {
      id: "tyndale-open-study-notes",
      title: "Tyndale Open Study Notes",
      license: "cc-by-sa-4.0",
      attribution:
        "Tyndale Open Study Notes © Tyndale House Publishers. Licensed under CC BY-SA 4.0. https://tyndaleopenresources.com/",
    },
  });

  console.log("Done. Processed commentary now uses Tyndale Open Study Notes.");
}

main();
