import { CANON_ABBRS } from "@/lib/canon";

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
