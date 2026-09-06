#!/usr/bin/env node
/**
 * Ingest public-domain Bible text + commentary, then tag commentary
 * sections to concrete verse keys.
 *
 * Sources (CC0 / public domain only — do not point this at copyrighted sites):
 * - KJV: aruljohn/Bible-kjv
 * - Commentary: OpenChristianData matthew-henry (CC0)
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const RAW_BIBLE = path.join(ROOT, "data/raw/bible");
const RAW_COMMENTARY = path.join(ROOT, "data/raw/commentary/matthew-henry");
const OUT = path.join(ROOT, "data/processed");

const BOOK_SLUGS = {
  Genesis: "genesis",
  Psalms: "psalms",
  John: "john",
};

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

function loadBibleBook(book) {
  const file = path.join(RAW_BIBLE, `${book}.json`);
  const raw = JSON.parse(fs.readFileSync(file, "utf8"));
  return {
    book: raw.book,
    slug: BOOK_SLUGS[raw.book],
    chapters: raw.chapters.map((ch) => ({
      chapter: Number(ch.chapter),
      verses: ch.verses.map((v) => ({
        verse: Number(v.verse),
        text: v.text,
      })),
    })),
  };
}

function loadCommentaryBook(slug, bookName, bible) {
  const file = path.join(RAW_COMMENTARY, `${slug}.json`);
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
      excerpt: (item.commentary_text ?? "").slice(0, 280).replace(/\s+/g, " ").trim(),
    };
    entries.push(entry);

    if (chapter === 0 && range === "intro") {
      bookIntro = entry.id;
      continue;
    }
    if (range === "intro" && chapter > 0) {
      byChapterIntro[chapter] ??= [];
      byChapterIntro[chapter].push(entry.id);
      // Surface chapter intros when any verse in the chapter is selected.
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

function writeJson(file, data) {
  ensureDir(path.dirname(file));
  fs.writeFileSync(file, JSON.stringify(data));
}

function main() {
  ensureDir(OUT);
  ensureDir(path.join(OUT, "bible"));
  ensureDir(path.join(OUT, "commentary"));

  const catalog = [];

  for (const [book, slug] of Object.entries(BOOK_SLUGS)) {
    console.log(`Ingesting ${book}...`);
    const bible = loadBibleBook(book);
    const commentary = loadCommentaryBook(slug, book, bible);

    writeJson(path.join(OUT, "bible", `${slug}.json`), bible);

    // Compact runtime payload: entries keyed by id + verse index
    const runtime = {
      book,
      slug,
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
    writeJson(path.join(OUT, "commentary", `${slug}.json`), runtime);

    const taggedVerses = Object.keys(commentary.byVerse).length;
    catalog.push({
      book,
      slug,
      chapters: bible.chapters.length,
      commentaryEntries: commentary.entries.length,
      taggedVerses,
      license: commentary.meta.license,
      author: commentary.meta.author,
    });
    console.log(
      `  ${bible.chapters.length} chapters, ${commentary.entries.length} commentary entries, ${taggedVerses} verse tags`,
    );
  }

  writeJson(path.join(OUT, "catalog.json"), { books: catalog, generatedAt: new Date().toISOString() });

  // Tiny unit check for the tagger
  const samples = [
    ["1-3", [1, 2, 3]],
    ["5", [5]],
    ["1-2,5", [1, 2, 5]],
    ["intro", []],
  ];
  for (const [input, expected] of samples) {
    const got = expandVerseRange(input);
    if (JSON.stringify(got) !== JSON.stringify(expected)) {
      throw new Error(`expandVerseRange(${input}) => ${got}, expected ${expected}`);
    }
  }
  console.log("Done. Catalog:", catalog.map((b) => b.slug).join(", "));
}

main();
