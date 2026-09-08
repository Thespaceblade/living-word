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
import {
  getLicensedMeta,
  isLicensedVersionConfigured,
  isLicensedVersionId,
  licensedVersionsForUi,
} from "./licensed-versions";
import { loadLicensedChapter } from "./remote-bible";

const PROCESSED = path.join(process.cwd(), "data/processed");

function readJson<T>(file: string): T {
  return JSON.parse(fs.readFileSync(file, "utf8")) as T;
}

export function getCatalog(): Catalog {
  return readJson<Catalog>(path.join(PROCESSED, "catalog.json"));
}

export function getLocalVersions(): BibleVersion[] {
  return getCatalog().versions.map((v) => ({
    ...v,
    source: "local" as const,
    ready: true,
  }));
}

export function getVersions(): BibleVersion[] {
  return [...getLocalVersions(), ...licensedVersionsForUi()];
}

export function isValidVersion(version: string): boolean {
  return getVersions().some((v) => v.id === version);
}

export function isLocalVersion(version: string): boolean {
  return getCatalog().versions.some((v) => v.id === version);
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
  if (isLicensedVersionId(version)) return null;
  const book = getBibleBook(version, slug);
  const ch = book.chapters.find((c) => c.chapter === chapter);
  if (!ch) return null;
  return {
    book: book.book,
    slug: book.slug,
    version: book.version,
    chapter: ch,
    copyright: null as string | null,
  };
}

export async function getChapterForRead(
  version: string,
  slug: string,
  chapter: number,
) {
  if (isLicensedVersionId(version)) {
    if (!isLicensedVersionConfigured(version)) {
      return {
        status: "needs_key" as const,
        meta: getLicensedMeta(version),
      };
    }
    try {
      const remote = await loadLicensedChapter(version, slug, chapter);
      if (!remote) {
        return { status: "error" as const, message: "Chapter unavailable" };
      }
      return {
        status: "ok" as const,
        book: remote.book,
        slug: remote.slug,
        version: remote.version,
        chapter: remote.chapter,
        copyright: remote.copyright,
      };
    } catch (error) {
      return {
        status: "error" as const,
        message:
          error instanceof Error ? error.message : "Licensed API request failed",
      };
    }
  }

  const local = getChapter(version, slug, chapter);
  if (!local) return { status: "missing" as const };
  return { status: "ok" as const, ...local };
}

export function getVerseText(
  version: string,
  slug: string,
  chapter: number,
  verse: number,
): string | null {
  const data = getChapter(version, slug, chapter);
  return data?.chapter.verses.find((v) => v.verse === verse)?.text ?? null;
}

export async function getVerseTextAsync(
  version: string,
  slug: string,
  chapter: number,
  verse: number,
): Promise<string | null> {
  if (isLocalVersion(version)) {
    return getVerseText(version, slug, chapter, verse);
  }
  const loaded = await getChapterForRead(version, slug, chapter);
  if (loaded.status !== "ok") return null;
  return loaded.chapter.verses.find((v) => v.verse === verse)?.text ?? null;
}

export function verseKey(book: string, chapter: number, verse: number) {
  return `${book}.${chapter}.${verse}`;
}

export function getIntel(
  ref: VerseRef,
  version: string,
): IntelPayload | null {
  if (isLicensedVersionId(version)) return null;
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

export async function getIntelAsync(
  ref: VerseRef,
  version: string,
): Promise<IntelPayload | null> {
  if (!isLicensedVersionId(version)) {
    return getIntel(ref, version);
  }

  const verseText = await getVerseTextAsync(
    version,
    ref.slug,
    ref.chapter,
    ref.verse,
  );
  if (!verseText) return null;

  const commentary = getCommentaryBundle(ref.slug);
  const book =
    getCatalog().books.find((b) => b.slug === ref.slug)?.book ?? ref.book;
  const key = verseKey(book, ref.chapter, ref.verse);
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
      book,
      slug: ref.slug,
      chapter: ref.chapter,
      verse: ref.verse,
    },
    verseText,
    meta: commentary.meta,
    entries,
    bookIntro,
  };
}

export function slugFromBookName(book: string): string | null {
  return getCatalog().books.find((b) => b.book === book)?.slug ?? null;
}
