import fs from "node:fs";
import path from "node:path";
import { getBibleBook, getCatalog, isLocalVersion } from "./content";
import type { SearchHit, SearchMode, SearchResponse } from "./search-shared";
import { SEARCH_TOPICS } from "./search-shared";
import type { WordToken } from "./types";

export type {
  SearchHit,
  SearchMode,
  SearchResponse,
  TopicItem,
} from "./search-shared";
export { SEARCH_TOPICS } from "./search-shared";

const PROCESSED = path.join(process.cwd(), "data/processed");

type TextVerse = {
  book: string;
  slug: string;
  chapter: number;
  verse: number;
  text: string;
  textLower: string;
};

type StrongsHit = {
  slug: string;
  book: string;
  chapter: number;
  verse: number;
  strongs: string;
  gloss: string;
  tlit: string;
};

type WordsBundle = {
  slug: string;
  lang: "hebrew" | "greek";
  chapters: Record<string, Record<string, WordToken[]>>;
};

type SearchIndex = {
  textByVersion: Map<string, TextVerse[]>;
  strongs: Map<string, StrongsHit[]>;
};

let cachedIndex: SearchIndex | null = null;

function readJson<T>(file: string): T {
  return JSON.parse(fs.readFileSync(file, "utf8")) as T;
}

function buildIndex(): SearchIndex {
  const catalog = getCatalog();
  const textByVersion = new Map<string, TextVerse[]>();

  for (const version of catalog.versions) {
    const verses: TextVerse[] = [];
    for (const book of catalog.books) {
      const bible = getBibleBook(version.id, book.slug);
      for (const chapter of bible.chapters) {
        for (const verse of chapter.verses) {
          verses.push({
            book: bible.book,
            slug: bible.slug,
            chapter: chapter.chapter,
            verse: verse.verse,
            text: verse.text,
            textLower: verse.text.toLowerCase(),
          });
        }
      }
    }
    textByVersion.set(version.id, verses);
  }

  const strongs = new Map<string, StrongsHit[]>();
  const bookName = new Map(catalog.books.map((b) => [b.slug, b.book]));

  for (const book of catalog.books) {
    const file = path.join(PROCESSED, "words", `${book.slug}.json`);
    if (!fs.existsSync(file)) continue;
    const bundle = readJson<WordsBundle>(file);
    for (const [chapterKey, verseMap] of Object.entries(bundle.chapters)) {
      const chapter = Number(chapterKey);
      for (const [verseKey, tokens] of Object.entries(verseMap)) {
        const verse = Number(verseKey);
        for (const token of tokens) {
          const key = normalizeStrongs(token.strongs);
          if (!key) continue;
          const list = strongs.get(key) ?? [];
          const already = list.some(
            (hit) =>
              hit.slug === book.slug &&
              hit.chapter === chapter &&
              hit.verse === verse,
          );
          if (!already) {
            list.push({
              slug: book.slug,
              book: bookName.get(book.slug) ?? book.book,
              chapter,
              verse,
              strongs: key,
              gloss: token.gloss,
              tlit: token.tlit,
            });
            strongs.set(key, list);
          }
        }
      }
    }
  }

  return { textByVersion, strongs };
}

function getIndex(): SearchIndex {
  if (!cachedIndex) cachedIndex = buildIndex();
  return cachedIndex;
}

export function normalizeStrongs(raw: string): string | null {
  const cleaned = raw.trim().toUpperCase().replace(/^STRONG'?S?\s*/i, "");
  const match = cleaned.match(/^([HG])?0*(\d{1,5})$/);
  if (!match) return null;
  const num = match[2];
  if (!num) return null;
  const prefix = match[1] ?? (Number(num) >= 4000 ? "G" : "H");
  return `${prefix}${Number(num)}`;
}

export function detectSearchMode(
  query: string,
  explicit?: string | null,
): SearchMode {
  if (explicit === "text" || explicit === "strongs" || explicit === "topic") {
    return explicit;
  }
  if (normalizeStrongs(query)) return "strongs";
  const isTopic = SEARCH_TOPICS.some(
    (t) => t.query.toLowerCase() === query.trim().toLowerCase(),
  );
  if (isTopic) return "topic";
  return "text";
}

const STOP = new Set([
  "a",
  "an",
  "and",
  "as",
  "at",
  "be",
  "but",
  "by",
  "for",
  "from",
  "he",
  "her",
  "his",
  "i",
  "in",
  "into",
  "is",
  "it",
  "me",
  "my",
  "not",
  "of",
  "on",
  "or",
  "our",
  "so",
  "that",
  "the",
  "their",
  "them",
  "then",
  "there",
  "they",
  "this",
  "to",
  "unto",
  "up",
  "was",
  "we",
  "which",
  "who",
  "with",
  "ye",
  "you",
  "your",
]);

function scoreText(haystack: string, needle: string, words: string[]): number {
  if (!needle) return 0;
  if (haystack.includes(needle)) {
    return needle.includes(" ") ? 100 : 80;
  }
  const meaningful = words.filter((w) => w.length > 2 && !STOP.has(w));
  const terms = meaningful.length > 0 ? meaningful : words.filter((w) => w.length > 1);
  if (terms.length === 0) return 0;
  const matched = terms.filter((w) => haystack.includes(w)).length;
  // Require every meaningful term for keyword search
  if (matched < terms.length) return 0;
  return 40 + matched * 5;
}

function snippetAround(text: string, query: string): string {
  const lower = text.toLowerCase();
  const idx = lower.indexOf(query.toLowerCase());
  if (idx < 0 || text.length <= 160) return text;
  const start = Math.max(0, idx - 48);
  const end = Math.min(text.length, idx + query.length + 72);
  const slice = text.slice(start, end).trim();
  return `${start > 0 ? "…" : ""}${slice}${end < text.length ? "…" : ""}`;
}

function lookupVerseText(
  version: string,
  slug: string,
  chapter: number,
  verse: number,
): string {
  const verses = getIndex().textByVersion.get(version) ?? [];
  return (
    verses.find(
      (v) => v.slug === slug && v.chapter === chapter && v.verse === verse,
    )?.text ?? ""
  );
}

export function searchLibrary(options: {
  query: string;
  version?: string;
  mode?: string | null;
  limit?: number;
}): SearchResponse {
  const catalog = getCatalog();
  const version =
    options.version && isLocalVersion(options.version)
      ? options.version
      : (catalog.versions[0]?.id ?? "kjv");
  const rawQuery = options.query.trim();
  const mode = detectSearchMode(rawQuery, options.mode);
  const limit = Math.min(Math.max(options.limit ?? 40, 1), 100);

  if (!rawQuery) {
    return { query: rawQuery, mode, version, total: 0, results: [] };
  }

  const index = getIndex();

  if (mode === "strongs") {
    const key = normalizeStrongs(rawQuery);
    if (!key) {
      return { query: rawQuery, mode, version, total: 0, results: [] };
    }
    let hits = index.strongs.get(key) ?? [];
    if (hits.length === 0 && !/^[HG]/i.test(rawQuery.trim())) {
      const alt = key.startsWith("H")
        ? `G${key.slice(1)}`
        : `H${key.slice(1)}`;
      hits = index.strongs.get(alt) ?? [];
    }
    const results: SearchHit[] = hits.slice(0, limit).map((hit) => ({
      book: hit.book,
      slug: hit.slug,
      chapter: hit.chapter,
      verse: hit.verse,
      text: lookupVerseText(version, hit.slug, hit.chapter, hit.verse),
      match: "strongs",
      strongs: hit.strongs,
      gloss: hit.gloss,
      tlit: hit.tlit,
    }));
    return {
      query: rawQuery,
      mode,
      version,
      total: hits.length,
      results,
    };
  }

  const needle = rawQuery.toLowerCase();
  const words = needle.split(/\s+/).filter((w) => w.length > 1);
  const verses = index.textByVersion.get(version) ?? [];
  const ranked = verses
    .map((verse) => ({
      verse,
      score: scoreText(verse.textLower, needle, words),
    }))
    .filter((row) => row.score > 0)
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      if (a.verse.slug !== b.verse.slug) {
        return a.verse.slug.localeCompare(b.verse.slug);
      }
      if (a.verse.chapter !== b.verse.chapter) {
        return a.verse.chapter - b.verse.chapter;
      }
      return a.verse.verse - b.verse.verse;
    });

  const results: SearchHit[] = ranked.slice(0, limit).map(({ verse }) => ({
    book: verse.book,
    slug: verse.slug,
    chapter: verse.chapter,
    verse: verse.verse,
    text: snippetAround(verse.text, rawQuery),
    match: mode === "topic" ? "topic" : "text",
  }));

  return {
    query: rawQuery,
    mode: mode === "topic" ? "topic" : "text",
    version,
    total: ranked.length,
    results,
  };
}
