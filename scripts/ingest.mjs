#!/usr/bin/env node
/**
 * Ingest public-domain Bible text + commentary, then tag commentary
 * sections to concrete verse keys.
 *
 * Bible versions (public domain / free only):
 * - kjv: aruljohn/Bible-kjv
 * - asv / web: midvash/bible-data
 * - bsb / bbe / nheb: scrollmapper/bible_databases
 * Commentary: OpenChristianData matthew-henry (CC0); optional per book
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { BOOK_SLUGS, CANON, VERSIONS } from "./canon.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const RAW_BIBLE = path.join(ROOT, "data/raw/bible");
const RAW_COMMENTARY = path.join(ROOT, "data/raw/commentary/matthew-henry");
const OUT = path.join(ROOT, "data/processed");

/** Expand "1-3", "5", "1-2,5" into verse numbers. "intro" → []. */
export function expandVerseRange(range) {
  if (!range || range === "intro") return [];
  const verses = new Set();
  for (const part of String(range).split(",")) {
    const token = part.trim();
    if (!token || token === "intro") continue;
    if (token.includes("-")) {
      const [a, b] = token.split("-").map((n) => Number.parseInt(n, 10));
      if (!Number.isFinite(a) || !Number.isFinite(b)) continue;
      const [start, end] = a <= b ? [a, b] : [b, a];
      for (let v = start; v <= end; v++) verses.add(v);
    } else {
      const n = Number.parseInt(token, 10);
      if (Number.isFinite(n)) verses.add(n);
    }
  }
  return [...verses].sort((a, b) => a - b);
}

function verseKey(book, chapter, verse) {
  return `${book}.${chapter}.${verse}`;
}

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function writeJson(file, data) {
  ensureDir(path.dirname(file));
  fs.writeFileSync(file, JSON.stringify(data));
}

function loadBibleBook(versionId, book) {
  const file = path.join(RAW_BIBLE, versionId, `${book}.json`);
  const raw = JSON.parse(fs.readFileSync(file, "utf8"));
  const bookName = raw.englishName || raw.book;
  if (!BOOK_SLUGS[bookName]) {
    throw new Error(`Unknown book name in ${file}: ${bookName}`);
  }
  return {
    book: bookName,
    slug: BOOK_SLUGS[bookName],
    version: versionId,
    chapters: raw.chapters.map((ch) => ({
      chapter: Number(ch.chapter),
      verses: ch.verses.map((v) => ({
        verse: Number(v.verse ?? v.number),
        text: v.text,
      })),
    })),
  };
}

function emptyCommentary(bookName, slug) {
  return {
    meta: {
      id: "matthew-henry-complete",
      title: "Matthew Henry's Commentary",
      author: "Matthew Henry",
      license: "cc0-1.0",
      source: "OpenChristianData/open-christian-data",
    },
    entries: [],
    byVerse: {},
    byChapterIntro: {},
    bookIntro: null,
    book: bookName,
    slug,
  };
}

function loadCommentaryBook(slug, bookName, bible, commentaryFile) {
  if (!commentaryFile) return emptyCommentary(bookName, slug);
  const file = path.join(RAW_COMMENTARY, `${commentaryFile}.json`);
  if (!fs.existsSync(file)) {
    console.warn(`  no commentary file for ${slug}, continuing without it`);
    return emptyCommentary(bookName, slug);
  }
  const raw = JSON.parse(fs.readFileSync(file, "utf8"));
  const meta = {
    id: raw.meta?.id ?? "matthew-henry-complete",
    title: raw.meta?.title ?? "Matthew Henry's Commentary",
    author: raw.meta?.author ?? "Matthew Henry",
    license: raw.meta?.license ?? "cc0-1.0",
    source: "OpenChristianData/open-christian-data",
  };

  const entries = [];
  const byVerse = {};
  const byChapterIntro = {};
  let bookIntro = null;
  const chapterVerseCounts = Object.fromEntries(
    bible.chapters.map((ch) => [ch.chapter, ch.verses.map((v) => v.verse)]),
  );

  for (const item of raw.data ?? []) {
    const chapter = Number(item.chapter ?? 0);
    const range = item.verse_range ?? "";
    const verses = expandVerseRange(range);
    const entry = {
      id: item.entry_id,
      source: meta.id,
      author: meta.author,
      book: bookName,
      chapter,
      verseRange: range,
      verses,
      crossReferences: item.cross_references ?? [],
      wordCount: item.word_count ?? null,
      text: item.commentary_text ?? "",
      excerpt: (item.commentary_text ?? "")
        .slice(0, 280)
        .replace(/\s+/g, " ")
        .trim(),
    };
    entries.push(entry);

    if (chapter === 0 && range === "intro") {
      bookIntro = entry.id;
      continue;
    }
    if (range === "intro" && chapter > 0) {
      byChapterIntro[chapter] ??= [];
      byChapterIntro[chapter].push(entry.id);
      for (const v of chapterVerseCounts[chapter] ?? []) {
        const key = verseKey(bookName, chapter, v);
        byVerse[key] ??= [];
        if (!byVerse[key].includes(entry.id)) byVerse[key].push(entry.id);
      }
      continue;
    }

    for (const v of verses) {
      const key = verseKey(bookName, chapter, v);
      byVerse[key] ??= [];
      byVerse[key].push(entry.id);
    }
  }

  return { meta, entries, byVerse, byChapterIntro, bookIntro };
}

function main() {
  ensureDir(OUT);
  ensureDir(path.join(OUT, "bible"));
  ensureDir(path.join(OUT, "commentary"));

  const books = [];

  for (const book of CANON) {
    console.log(`Ingesting commentary tags for ${book.name}...`);
    const kjv = loadBibleBook("kjv", book.name);
    const commentary = loadCommentaryBook(
      book.slug,
      book.name,
      kjv,
      book.commentary,
    );
    const runtime = {
      book: book.name,
      slug: book.slug,
      meta: commentary.meta,
      bookIntroId: commentary.bookIntro,
      byChapterIntro: commentary.byChapterIntro,
      byVerse: commentary.byVerse,
      entries: Object.fromEntries(
        commentary.entries.map((e) => [
          e.id,
          {
            id: e.id,
            source: e.source,
            author: e.author,
            chapter: e.chapter,
            verseRange: e.verseRange,
            verses: e.verses,
            crossReferences: e.crossReferences,
            wordCount: e.wordCount,
            excerpt: e.excerpt,
            text: e.text,
          },
        ]),
      ),
    };
    writeJson(path.join(OUT, "commentary", `${book.slug}.json`), runtime);

    books.push({
      book: book.name,
      slug: book.slug,
      chapters: kjv.chapters.length,
      commentaryEntries: commentary.entries.length,
      taggedVerses: Object.keys(commentary.byVerse).length,
      license: commentary.meta.license,
      author: commentary.meta.author,
    });
    console.log(
      `  ${commentary.entries.length} commentary entries, ${Object.keys(commentary.byVerse).length} verse tags`,
    );
  }

  for (const version of VERSIONS) {
    console.log(`Ingesting Bible text: ${version.id}...`);
    ensureDir(path.join(OUT, "bible", version.id));
    for (const book of CANON) {
      const bible = loadBibleBook(version.id, book.name);
      writeJson(path.join(OUT, "bible", version.id, `${book.slug}.json`), bible);
      console.log(`  ${version.id}/${book.slug}: ${bible.chapters.length} chapters`);
    }
  }

  writeJson(path.join(OUT, "catalog.json"), {
    versions: VERSIONS,
    books,
    generatedAt: new Date().toISOString(),
  });

  const samples = [
    ["1-3", [1, 2, 3]],
    ["5", [5]],
    ["1-2,5", [1, 2, 5]],
    ["intro", []],
  ];
  for (const [input, expected] of samples) {
    const got = expandVerseRange(input);
    if (JSON.stringify(got) !== JSON.stringify(expected)) {
      throw new Error(
        `expandVerseRange(${input}) => ${got}, expected ${expected}`,
      );
    }
  }
  console.log(
    "Done.",
    VERSIONS.map((v) => v.id).join("/"),
    `${books.length} books`,
  );
}

main();
