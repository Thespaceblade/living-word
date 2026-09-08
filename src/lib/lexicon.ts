import fs from "node:fs";
import path from "node:path";
import { getCatalog, getVerseText } from "@/lib/content";
import { normalizeStrongs } from "@/lib/search";

const PROCESSED = path.join(process.cwd(), "data/processed");

export type LexiconEntry = {
  id: string;
  lemma: string;
  translit: string;
  pronunciation: string;
  derivation: string;
  strongsDef: string;
  kjvDef: string;
  lang: "hebrew" | "greek";
  source: string;
  license: string;
  attribution: string;
};

export type ConcordanceHit = {
  book: string;
  slug: string;
  chapter: number;
  verse: number;
  text: string;
  gloss: string;
  tlit: string;
};

export type LexiconPayload = {
  strongs: string;
  entry: LexiconEntry | null;
  occurrences: ConcordanceHit[];
  total: number;
};

type LexiconBundle = {
  lang: "hebrew" | "greek";
  source: string;
  license: string;
  attribution: string;
  entries: Record<
    string,
    {
      id: string;
      lemma: string;
      translit: string;
      pronunciation: string;
      derivation: string;
      strongsDef: string;
      kjvDef: string;
    }
  >;
};

type WordsBundle = {
  slug: string;
  chapters: Record<
    string,
    Record<string, { strongs: string; gloss: string; tlit: string }[]>
  >;
};

type ConcordanceIndex = Map<
  string,
  { slug: string; book: string; chapter: number; verse: number; gloss: string; tlit: string }[]
>;

let greek: LexiconBundle | null | undefined;
let hebrew: LexiconBundle | null | undefined;
let concordance: ConcordanceIndex | null = null;

function readJson<T>(file: string): T {
  return JSON.parse(fs.readFileSync(file, "utf8")) as T;
}

function loadBundle(lang: "greek" | "hebrew"): LexiconBundle | null {
  const file = path.join(PROCESSED, "lexicon", `${lang}.json`);
  if (!fs.existsSync(file)) return null;
  return readJson<LexiconBundle>(file);
}

function getGreek() {
  if (greek === undefined) greek = loadBundle("greek");
  return greek;
}

function getHebrew() {
  if (hebrew === undefined) hebrew = loadBundle("hebrew");
  return hebrew;
}

function buildConcordance(): ConcordanceIndex {
  const catalog = getCatalog();
  const bookName = new Map(catalog.books.map((b) => [b.slug, b.book]));
  const index: ConcordanceIndex = new Map();

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
          const list = index.get(key) ?? [];
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
              gloss: token.gloss,
              tlit: token.tlit,
            });
            index.set(key, list);
          }
        }
      }
    }
  }
  return index;
}

function getConcordance() {
  if (!concordance) concordance = buildConcordance();
  return concordance;
}

export function getLexiconEntry(strongsRaw: string): LexiconEntry | null {
  const id = normalizeStrongs(strongsRaw);
  if (!id) return null;
  const bundle = id.startsWith("G") ? getGreek() : getHebrew();
  if (!bundle) return null;
  const entry = bundle.entries[id];
  if (!entry) return null;
  return {
    ...entry,
    lang: bundle.lang,
    source: bundle.source,
    license: bundle.license,
    attribution: bundle.attribution,
  };
}

export function getLexiconPayload(
  strongsRaw: string,
  options?: { version?: string; limit?: number; exclude?: string },
): LexiconPayload | null {
  const id = normalizeStrongs(strongsRaw);
  if (!id) return null;

  const entry = getLexiconEntry(id);
  const version = options?.version ?? getCatalog().versions[0]?.id ?? "kjv";
  const limit = Math.min(Math.max(options?.limit ?? 24, 1), 80);
  const exclude = options?.exclude ?? "";

  const hits = getConcordance().get(id) ?? [];
  const filtered = hits.filter(
    (hit) => `${hit.slug}:${hit.chapter}:${hit.verse}` !== exclude,
  );

  const occurrences: ConcordanceHit[] = filtered.slice(0, limit).map((hit) => ({
    book: hit.book,
    slug: hit.slug,
    chapter: hit.chapter,
    verse: hit.verse,
    text: getVerseText(version, hit.slug, hit.chapter, hit.verse) ?? "",
    gloss: hit.gloss,
    tlit: hit.tlit,
  }));

  return {
    strongs: id,
    entry,
    occurrences,
    total: filtered.length,
  };
}
