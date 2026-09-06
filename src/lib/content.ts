import fs from "node:fs";
import path from "node:path";
import type {
  BibleBook,
  BibleVersion,
  Catalog,
  CommentaryBundle,
  CommentaryEntry,
  IntelPayload,
  VerseRef,
} from "./types";

const PROCESSED = path.join(process.cwd(), "data/processed");

function readJson<T>(file: string): T {
  return JSON.parse(fs.readFileSync(file, "utf8")) as T;
}

export function getCatalog(): Catalog {
  return readJson<Catalog>(path.join(PROCESSED, "catalog.json"));
}

export function getVersions(): BibleVersion[] {
  return getCatalog().versions;
}

export function isValidVersion(version: string): boolean {
  return getVersions().some((v) => v.id === version);
}

export function getBibleBook(version: string, slug: string): BibleBook {
  return readJson<BibleBook>(
    path.join(PROCESSED, "bible", version, `${slug}.json`),
  );
}

export function getCommentaryBundle(slug: string): CommentaryBundle {
  return readJson<CommentaryBundle>(
    path.join(PROCESSED, "commentary", `${slug}.json`),
  );
}

export function getChapter(version: string, slug: string, chapter: number) {
  const book = getBibleBook(version, slug);
  const ch = book.chapters.find((c) => c.chapter === chapter);
  if (!ch) return null;
  return {
    book: book.book,
    slug: book.slug,
    version: book.version,
    chapter: ch,
  };
}

export function verseKey(book: string, chapter: number, verse: number) {
  return `${book}.${chapter}.${verse}`;
}

export function getIntel(
  ref: VerseRef,
  version: string,
): IntelPayload | null {
  const bible = getBibleBook(version, ref.slug);
  const chapter = bible.chapters.find((c) => c.chapter === ref.chapter);
  const verse = chapter?.verses.find((v) => v.verse === ref.verse);
  if (!chapter || !verse) return null;

  const commentary = getCommentaryBundle(ref.slug);
  const key = verseKey(bible.book, ref.chapter, ref.verse);
  const ids = commentary.byVerse[key] ?? [];

  const entries = ids
    .map((id) => commentary.entries[id])
    .filter(Boolean)
    .sort((a, b) => {
      const aIntro = a.verseRange === "intro" ? 1 : 0;
      const bIntro = b.verseRange === "intro" ? 1 : 0;
      if (aIntro !== bIntro) return aIntro - bIntro;
      return (a.verses[0] ?? 0) - (b.verses[0] ?? 0);
    }) as CommentaryEntry[];

  const bookIntro = commentary.bookIntroId
    ? commentary.entries[commentary.bookIntroId] ?? null
    : null;

  return {
    ref: {
      book: bible.book,
      slug: bible.slug,
      chapter: ref.chapter,
      verse: ref.verse,
    },
    verseText: verse.text,
    meta: commentary.meta,
    entries,
    bookIntro,
  };
}

export function slugFromBookName(book: string): string | null {
  return getCatalog().books.find((b) => b.book === book)?.slug ?? null;
}
