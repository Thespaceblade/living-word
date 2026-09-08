import fs from "node:fs";
import path from "node:path";
import type { BibleChapter, BibleVerse } from "@/lib/types";
import {
  apiBibleIdFor,
  apiBibleKey,
  esvApiKey,
  esvPassageQuery,
  getLicensedMeta,
  isLicensedVersionConfigured,
  isLicensedVersionId,
  type LicensedVersionId,
  usfmChapterId,
} from "@/lib/licensed-versions";

const CACHE_ROOT = path.join(process.cwd(), "data/cache/bible");
const CACHE_MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000;

export type LicensedChapter = {
  book: string;
  slug: string;
  version: string;
  chapter: BibleChapter;
  copyright: string;
  cachedAt: string;
};

type CacheFile = LicensedChapter;

function cachePath(version: string, slug: string, chapter: number) {
  return path.join(CACHE_ROOT, version, slug, `${chapter}.json`);
}

function readCache(
  version: string,
  slug: string,
  chapter: number,
): CacheFile | null {
  const file = cachePath(version, slug, chapter);
  if (!fs.existsSync(file)) return null;
  try {
    const raw = JSON.parse(fs.readFileSync(file, "utf8")) as CacheFile;
    const age = Date.now() - Date.parse(raw.cachedAt);
    if (!Number.isFinite(age) || age > CACHE_MAX_AGE_MS) return null;
    return raw;
  } catch {
    return null;
  }
}

function writeCache(payload: CacheFile) {
  const file = cachePath(payload.version, payload.slug, payload.chapter.chapter);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, JSON.stringify(payload));
}

function bookTitle(slug: string): string {
  if (slug === "genesis") return "Genesis";
  if (slug === "psalms") return "Psalms";
  if (slug === "john") return "John";
  return slug;
}

/** Parse ESV passage text with [n] verse markers. */
export function parseNumberedVerses(passage: string): BibleVerse[] {
  const cleaned = passage
    .replace(/\([A-Z]{2,5}\)\s*$/g, "")
    .replace(/\r/g, "")
    .trim();

  const matches = [...cleaned.matchAll(/\[(\d+)\]\s*/g)];
  if (!matches.length) {
    const fallback = cleaned.replace(/^\s*[A-Za-z0-9 .:]+\n+/, "").trim();
    return fallback ? [{ verse: 1, text: fallback.replace(/\s+/g, " ") }] : [];
  }

  const verses: BibleVerse[] = [];
  for (let i = 0; i < matches.length; i += 1) {
    const match = matches[i]!;
    const verse = Number(match[1]);
    const start = (match.index ?? 0) + match[0].length;
    const end = i + 1 < matches.length ? (matches[i + 1]!.index ?? start) : cleaned.length;
    const text = cleaned
      .slice(start, end)
      .replace(/\s+/g, " ")
      .replace(/\s*\(ESV\)\s*$/i, "")
      .trim();
    if (Number.isFinite(verse) && text) verses.push({ verse, text });
  }
  return verses;
}

/** Parse API.Bible plain text chapters (`1 Text` / `¶ 1 Text`). */
export function parseApiBibleText(content: string): BibleVerse[] {
  const normalized = content
    .replace(/\r/g, "")
    .replace(/\u00a0/g, " ")
    .replace(/¶\s*/g, "\n")
    .trim();

  const parts = normalized.split(/\n(?=\s*\d+\s+)/);
  const verses: BibleVerse[] = [];
  for (const part of parts) {
    const match = part.trim().match(/^(\d+)\s+([\s\S]+)$/);
    if (!match) continue;
    const verse = Number(match[1]);
    const text = match[2].replace(/\s+/g, " ").trim();
    if (Number.isFinite(verse) && text) verses.push({ verse, text });
  }

  if (verses.length) return verses;

  // HTML-ish fallback: <span data-number="1"> or class="v 1"
  const htmlMatches = [
    ...content.matchAll(
      /(?:data-number|data-verse)=["'](\d+)["'][^>]*>([\s\S]*?)<\/span>/gi,
    ),
  ];
  for (const match of htmlMatches) {
    const verse = Number(match[1]);
    const text = match[2].replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
    if (Number.isFinite(verse) && text) verses.push({ verse, text });
  }
  return verses;
}

async function fetchEsvChapter(
  slug: string,
  chapter: number,
): Promise<LicensedChapter> {
  const key = esvApiKey();
  if (!key) throw new Error("ESV_API_KEY is not configured");
  const q = esvPassageQuery(slug, chapter);
  if (!q) throw new Error(`Unsupported ESV book: ${slug}`);

  const url = new URL("https://api.esv.org/v3/passage/text/");
  url.searchParams.set("q", q);
  url.searchParams.set("include-passage-references", "false");
  url.searchParams.set("include-verse-numbers", "true");
  url.searchParams.set("include-first-verse-numbers", "true");
  url.searchParams.set("include-footnotes", "false");
  url.searchParams.set("include-footnote-body", "false");
  url.searchParams.set("include-headings", "false");
  url.searchParams.set("include-short-copyright", "false");
  url.searchParams.set("include-selahs", "true");

  const res = await fetch(url, {
    headers: { Authorization: `Token ${key}` },
    next: { revalidate: 60 * 60 * 24 },
  });
  if (!res.ok) {
    throw new Error(`ESV API error ${res.status}`);
  }
  const json = (await res.json()) as { passages?: string[] };
  const passage = json.passages?.[0] ?? "";
  const verses = parseNumberedVerses(passage);
  if (!verses.length) throw new Error("ESV returned no verses");

  const meta = getLicensedMeta("esv")!;
  return {
    book: bookTitle(slug),
    slug,
    version: "esv",
    chapter: { chapter, verses },
    copyright: meta.copyright,
    cachedAt: new Date().toISOString(),
  };
}

async function fetchApiBibleChapter(
  version: LicensedVersionId,
  slug: string,
  chapter: number,
): Promise<LicensedChapter> {
  const key = apiBibleKey();
  const bibleId = apiBibleIdFor(version);
  const chapterId = usfmChapterId(slug, chapter);
  if (!key) throw new Error("API_BIBLE_KEY is not configured");
  if (!bibleId) throw new Error(`No API.Bible id for ${version}`);
  if (!chapterId) throw new Error(`Unsupported book: ${slug}`);

  const url = new URL(
    `https://api.scripture.api.bible/v1/bibles/${bibleId}/chapters/${chapterId}`,
  );
  url.searchParams.set("content-type", "text");
  url.searchParams.set("include-notes", "false");
  url.searchParams.set("include-titles", "false");
  url.searchParams.set("include-chapter-numbers", "false");
  url.searchParams.set("include-verse-numbers", "true");

  const res = await fetch(url, {
    headers: {
      "api-key": key,
      Accept: "application/json",
    },
    next: { revalidate: 60 * 60 * 24 },
  });
  if (!res.ok) {
    throw new Error(`API.Bible error ${res.status} for ${version}`);
  }
  const json = (await res.json()) as {
    data?: { content?: string; reference?: string };
  };
  const content = json.data?.content ?? "";
  const verses = parseApiBibleText(content);
  if (!verses.length) throw new Error(`${version} returned no verses`);

  const meta = getLicensedMeta(version)!;
  return {
    book: bookTitle(slug),
    slug,
    version,
    chapter: { chapter, verses },
    copyright: meta.copyright,
    cachedAt: new Date().toISOString(),
  };
}

export async function loadLicensedChapter(
  version: string,
  slug: string,
  chapter: number,
): Promise<LicensedChapter | null> {
  if (!isLicensedVersionId(version)) return null;
  if (!isLicensedVersionConfigured(version)) return null;

  const cached = readCache(version, slug, chapter);
  if (cached) return cached;

  const payload =
    version === "esv"
      ? await fetchEsvChapter(slug, chapter)
      : await fetchApiBibleChapter(version, slug, chapter);

  writeCache(payload);
  return payload;
}

export function licensedChapterErrorMessage(version: string): string {
  if (!isLicensedVersionId(version)) return "Unknown version";
  if (!isLicensedVersionConfigured(version)) {
    if (version === "esv") {
      return "Add ESV_API_KEY from api.esv.org to enable the ESV.";
    }
    return "Add API_BIBLE_KEY from scripture.api.bible to enable NIV and NKJV.";
  }
  return "Could not load this chapter from the licensed Bible API.";
}
