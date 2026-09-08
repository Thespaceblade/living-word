import { getCatalog, getChapter, getIntel, getIntelAsync, getVerseTextAsync } from "@/lib/content";
import { CANON_ABBRS } from "@/lib/canon";
import { isLicensedVersionId } from "@/lib/licensed-versions";
import type { VerseRef } from "@/lib/types";

/** Abbrs that resolve into the current corpus. */
export const ABBR_TO_SLUG: Record<string, string> = CANON_ABBRS;

export type ParsedXref = {
  raw: string;
  slug: string | null;
  label: string;
  chapter: number;
  verse: number;
};

export type XrefItem = {
  raw: string;
  label: string;
  slug: string | null;
  chapter: number;
  verse: number;
  /** Verse text when the target exists in the library for this version */
  text: string | null;
  jumpable: boolean;
};

export function parseXref(ref: string): ParsedXref | null {
  const match = ref.trim().match(/^([A-Za-z0-9]+)\.(\d+)\.(\d+)$/);
  if (!match) return null;
  const abbr = match[1];
  const chapter = Number(match[2]);
  const verse = Number(match[3]);
  return {
    raw: ref.trim(),
    slug: ABBR_TO_SLUG[abbr.toLowerCase()] ?? null,
    label: `${abbr} ${chapter}:${verse}`,
    chapter,
    verse,
  };
}

function snippet(text: string, max = 140) {
  const clean = text.replace(/\s+/g, " ").trim();
  if (clean.length <= max) return clean;
  return `${clean.slice(0, max).replace(/\s+\S*$/, "")}…`;
}

/**
 * Resolve commentary cross-refs against real Bible verses in the corpus.
 * In-library refs without a matching verse are dropped (not real).
 */
export function resolveXrefs(ref: VerseRef, version: string): XrefItem[] {
  const intel = getIntel(ref, version);
  if (!intel) return [];
  return buildXrefItems(intel.entries, version);
}

export async function resolveXrefsAsync(
  ref: VerseRef,
  version: string,
): Promise<XrefItem[]> {
  const intel = await getIntelAsync(ref, version);
  if (!intel) return [];
  return buildXrefItemsAsync(intel.entries, version);
}

function buildXrefItems(
  entries: { crossReferences: string[] }[],
  version: string,
): XrefItem[] {
  const catalogSlugs = new Set(getCatalog().books.map((b) => b.slug));
  const seen = new Set<string>();
  const items: XrefItem[] = [];

  for (const entry of entries) {
    for (const raw of entry.crossReferences) {
      if (seen.has(raw)) continue;
      seen.add(raw);

      const parsed = parseXref(raw);
      if (!parsed) continue;

      if (!parsed.slug || !catalogSlugs.has(parsed.slug)) {
        items.push({
          raw: parsed.raw,
          label: parsed.label,
          slug: parsed.slug,
          chapter: parsed.chapter,
          verse: parsed.verse,
          text: null,
          jumpable: false,
        });
        continue;
      }

      const chapterData = getChapter(version, parsed.slug, parsed.chapter);
      const verseText =
        chapterData?.chapter.verses.find((v) => v.verse === parsed.verse)
          ?.text ?? null;

      if (!chapterData || !verseText) continue;

      items.push({
        raw: parsed.raw,
        label: `${chapterData.book} ${parsed.chapter}:${parsed.verse}`,
        slug: parsed.slug,
        chapter: parsed.chapter,
        verse: parsed.verse,
        text: snippet(verseText),
        jumpable: true,
      });
    }
  }

  return items.sort((a, b) => Number(b.jumpable) - Number(a.jumpable));
}

async function buildXrefItemsAsync(
  entries: { crossReferences: string[] }[],
  version: string,
): Promise<XrefItem[]> {
  if (!isLicensedVersionId(version)) {
    return buildXrefItems(entries, version);
  }

  const catalog = getCatalog();
  const catalogSlugs = new Set(catalog.books.map((b) => b.slug));
  const seen = new Set<string>();
  const items: XrefItem[] = [];

  for (const entry of entries) {
    for (const raw of entry.crossReferences) {
      if (seen.has(raw)) continue;
      seen.add(raw);

      const parsed = parseXref(raw);
      if (!parsed) continue;

      if (!parsed.slug || !catalogSlugs.has(parsed.slug)) {
        items.push({
          raw: parsed.raw,
          label: parsed.label,
          slug: parsed.slug,
          chapter: parsed.chapter,
          verse: parsed.verse,
          text: null,
          jumpable: false,
        });
        continue;
      }

      const verseText = await getVerseTextAsync(
        version,
        parsed.slug,
        parsed.chapter,
        parsed.verse,
      );
      if (!verseText) continue;

      const book =
        catalog.books.find((b) => b.slug === parsed.slug)?.book ?? parsed.slug;

      items.push({
        raw: parsed.raw,
        label: `${book} ${parsed.chapter}:${parsed.verse}`,
        slug: parsed.slug,
        chapter: parsed.chapter,
        verse: parsed.verse,
        text: snippet(verseText),
        jumpable: true,
      });
    }
  }

  return items.sort((a, b) => Number(b.jumpable) - Number(a.jumpable));
}
