#!/usr/bin/env node
/**
 * Fetch Tyndale Open Study Notes (CC BY-SA 4.0) via the Free Use Bible API
 * into data/raw/commentary/tyndale-open-study-notes/{slug}.json
 *
 * Source: https://tyndaleopenresources.com/
 * API: https://bible.helloao.org/api/c/tyndale/
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { CANON } from "./canon.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const OUT = path.join(ROOT, "data/raw/commentary/tyndale-open-study-notes");
const BASE = "https://bible.helloao.org/api/c/tyndale";
const CONCURRENCY = 6;

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function writeJson(file, data) {
  ensureDir(path.dirname(file));
  fs.writeFileSync(file, JSON.stringify(data, null, 2));
}

async function fetchJson(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`${res.status} ${url}`);
  return res.json();
}

async function mapPool(items, limit, worker) {
  const results = new Array(items.length);
  let next = 0;
  async function run() {
    while (next < items.length) {
      const i = next++;
      results[i] = await worker(items[i], i);
    }
  }
  await Promise.all(
    Array.from({ length: Math.min(limit, items.length) }, () => run()),
  );
  return results;
}

/** Prefer USFM-style ids (GEN, 1CO) over title aliases (Ezek, Phil). */
const NAME_ALIASES = {
  "Song of Songs": "Song of Solomon",
  "Song of Solomon": "Song of Solomon",
  Psalms: "Psalms",
  Psalm: "Psalms",
};

function pickTyndaleBooks(apiBooks) {
  const chosen = new Map();
  for (const book of apiBooks) {
    const label = NAME_ALIASES[book.commonName] ??
      NAME_ALIASES[book.name] ??
      book.commonName ??
      book.name;
    const canon = CANON.find((c) => c.name === label);
    if (!canon) continue;
    const usfmLike = /^[0-9]?[A-Z]{2,3}$/.test(book.id);
    const score = usfmLike ? 2 : 1;
    const prev = chosen.get(canon.slug);
    if (!prev || score > prev.score) {
      chosen.set(canon.slug, {
        id: book.id,
        slug: canon.slug,
        name: canon.name,
        chapters: canon.chapters,
        introduction: book.introduction ?? "",
        score,
      });
    }
  }
  return [...chosen.values()].sort((a, b) =>
    CANON.findIndex((c) => c.slug === a.slug) -
    CANON.findIndex((c) => c.slug === b.slug),
  );
}

/** Parse "4:38", "4:39-40", "4:35–5:43" from the start of a note. */
export function parseNoteReference(text, fallbackChapter, fallbackVerse) {
  const match = String(text)
    .trim()
    .match(
      /^(\d+)\s*:\s*(\d+)(?:\s*[–-]\s*(?:(\d+)\s*:\s*)?(\d+))?/,
    );
  if (!match) {
    return {
      chapter: fallbackChapter,
      verseRange: String(fallbackVerse),
      verses: [fallbackVerse],
    };
  }
  const startChapter = Number(match[1]);
  const startVerse = Number(match[2]);
  const endChapter = match[3] ? Number(match[3]) : startChapter;
  const endVerse = match[4] ? Number(match[4]) : startVerse;
  const rangeLabel = match[0].replace(/\s+/g, "");

  if (startChapter !== endChapter) {
    return {
      chapter: startChapter,
      verseRange: rangeLabel,
      verses: [startVerse],
    };
  }

  const [from, to] =
    startVerse <= endVerse
      ? [startVerse, endVerse]
      : [endVerse, startVerse];
  const verses = [];
  for (let v = from; v <= to; v++) verses.push(v);
  return {
    chapter: startChapter,
    verseRange: from === to ? String(from) : `${from}-${to}`,
    verses,
  };
}

function cleanNoteText(text) {
  return String(text)
    .replace(/\u2022/g, "•")
    .replace(/\s+/g, " ")
    .trim();
}

async function fetchBook(book) {
  const chapters = await mapPool(
    Array.from({ length: book.chapters }, (_, i) => i + 1),
    CONCURRENCY,
    async (chapter) => {
      const url = `${BASE}/${book.id}/${chapter}.json`;
      try {
        return await fetchJson(url);
      } catch (error) {
        console.warn(`  skip ${book.id} ${chapter}: ${error.message}`);
        return null;
      }
    },
  );

  const data = [];
  for (const payload of chapters) {
    if (!payload?.chapter?.content) continue;
    const chapterNum = Number(payload.chapter.number);
    for (const item of payload.chapter.content) {
      if (item.type !== "verse" || !Array.isArray(item.content)) continue;
      const verseNum = Number(item.number);
      item.content.forEach((rawText, index) => {
        const text = cleanNoteText(rawText);
        if (!text) return;
        const ref = parseNoteReference(text, chapterNum, verseNum);
        data.push({
          entry_id: `tyndale-open-study-notes.${book.name}.${chapterNum}.${verseNum}.${index + 1}`,
          chapter: ref.chapter,
          verse_range: ref.verseRange,
          verses: ref.verses,
          api_verse: verseNum,
          commentary_text: text,
          word_count: text.split(/\s+/).filter(Boolean).length,
        });
      });
    }
  }

  return {
    meta: {
      id: "tyndale-open-study-notes",
      title: "Tyndale Open Study Notes",
      author: "Tyndale House Publishers",
      license: "cc-by-sa-4.0",
      source: "bible.helloao.org/api/c/tyndale",
      website: "https://tyndaleopenresources.com/",
      licenseUrl: "https://creativecommons.org/licenses/by-sa/4.0/",
    },
    book: book.name,
    slug: book.slug,
    introduction: book.introduction ?? "",
    data,
  };
}

async function main() {
  console.log("Fetching Tyndale Open Study Notes book list…");
  const listing = await fetchJson(`${BASE}/books.json`);
  const books = pickTyndaleBooks(listing.books ?? []);
  console.log(`Mapped ${books.length} Protestant books`);
  ensureDir(OUT);

  for (const book of books) {
    process.stdout.write(`  ${book.slug} (${book.id})… `);
    const packed = await fetchBook(book);
    writeJson(path.join(OUT, `${book.slug}.json`), packed);
    console.log(`${packed.data.length} notes`);
  }

  writeJson(path.join(OUT, "_meta.json"), {
    fetchedAt: new Date().toISOString(),
    books: books.map((b) => ({ id: b.id, slug: b.slug, name: b.name })),
    license: "cc-by-sa-4.0",
    attribution:
      "Tyndale Open Study Notes © Tyndale House Publishers. Licensed under CC BY-SA 4.0.",
  });
  console.log("Done →", OUT);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
