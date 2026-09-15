import type { CommentaryEntry } from "./types";

/**
 * Matthew Henry (and similar) packs often tag wide ranges (e.g. 1-21) even when
 * the stored text was truncated and never reaches later verses. Match and focus
 * commentary to the verse the reader actually selected.
 */

const ABBR: Record<string, string[]> = {
  Genesis: ["Gen", "Genesis"],
  Exodus: ["Exod", "Ex", "Exodus"],
  Leviticus: ["Lev", "Leviticus"],
  Numbers: ["Num", "Numbers"],
  Deuteronomy: ["Deut", "Deuteronomy"],
  Joshua: ["Josh", "Joshua"],
  Judges: ["Judg", "Judges"],
  Ruth: ["Ruth"],
  "1 Samuel": ["1Sam", "1 Sam", "I Samuel", "1 Samuel"],
  "2 Samuel": ["2Sam", "2 Sam", "II Samuel", "2 Samuel"],
  "1 Kings": ["1Kgs", "1 Kgs", "1 Kings", "I Kings"],
  "2 Kings": ["2Kgs", "2 Kgs", "2 Kings", "II Kings"],
  "1 Chronicles": ["1Chr", "1 Chr", "1 Chronicles"],
  "2 Chronicles": ["2Chr", "2 Chr", "2 Chronicles"],
  Ezra: ["Ezra"],
  Nehemiah: ["Neh", "Nehemiah"],
  Esther: ["Esth", "Esther"],
  Job: ["Job"],
  Psalms: ["Ps", "Psalm", "Psalms"],
  Proverbs: ["Prov", "Proverbs"],
  Ecclesiastes: ["Eccl", "Ecclesiastes"],
  "Song of Solomon": ["Song", "Cant", "Song of Solomon"],
  Isaiah: ["Isa", "Isaiah"],
  Jeremiah: ["Jer", "Jeremiah"],
  Lamentations: ["Lam", "Lamentations"],
  Ezekiel: ["Ezek", "Ezekiel"],
  Daniel: ["Dan", "Daniel"],
  Hosea: ["Hos", "Hosea"],
  Joel: ["Joel"],
  Amos: ["Amos"],
  Obadiah: ["Obad", "Obadiah"],
  Jonah: ["Jonah"],
  Micah: ["Mic", "Micah"],
  Nahum: ["Nah", "Nahum"],
  Habakkuk: ["Hab", "Habakkuk"],
  Zephaniah: ["Zeph", "Zephaniah"],
  Haggai: ["Hag", "Haggai"],
  Zechariah: ["Zech", "Zechariah"],
  Malachi: ["Mal", "Malachi"],
  Matthew: ["Matt", "Mt", "Matthew"],
  Mark: ["Mark", "Mk"],
  Luke: ["Luke", "Lk", "Luk"],
  John: ["John", "Joh", "Jn"],
  Acts: ["Acts", "Act"],
  Romans: ["Rom", "Romans"],
  "1 Corinthians": ["1Cor", "1 Cor", "I Corinthians", "1 Corinthians"],
  "2 Corinthians": ["2Cor", "2 Cor", "II Corinthians", "2 Corinthians"],
  Galatians: ["Gal", "Galatians"],
  Ephesians: ["Eph", "Ephesians"],
  Philippians: ["Phil", "Philippians"],
  Colossians: ["Col", "Colossians"],
  "1 Thessalonians": ["1Thess", "1 Thess", "1 Thessalonians"],
  "2 Thessalonians": ["2Thess", "2 Thess", "2 Thessalonians"],
  "1 Timothy": ["1Tim", "1 Tim", "1 Timothy"],
  "2 Timothy": ["2Tim", "2 Tim", "2 Timothy"],
  Titus: ["Titus"],
  Philemon: ["Phlm", "Philemon"],
  Hebrews: ["Heb", "Hebrews"],
  James: ["Jas", "James"],
  "1 Peter": ["1Pet", "1 Pet", "1 Peter"],
  "2 Peter": ["2Pet", "2 Pet", "2 Peter"],
  "1 John": ["1John", "1 John", "I John"],
  "2 John": ["2John", "2 John"],
  "3 John": ["3John", "3 John"],
  Jude: ["Jude"],
  Revelation: ["Rev", "Revelation"],
};

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function expandSpan(start: number, end: number): number[] {
  if (!Number.isFinite(start) || !Number.isFinite(end)) return [];
  const [a, b] = start <= end ? [start, end] : [end, start];
  const out: number[] = [];
  for (let v = a; v <= b; v++) out.push(v);
  return out;
}

/** Verses this chapter's commentary text and cross-refs actually discuss. */
export function citedVersesInChapter(
  text: string,
  crossReferences: string[],
  book: string,
  chapter: number,
): number[] {
  const found = new Set<number>();
  const abbrs = ABBR[book] ?? [book];
  const abbrAlt = abbrs.map(escapeRegExp).join("|");

  const bookChapter = new RegExp(
    `\\b(?:${abbrAlt})\\.?\\s*${chapter}\\s*:\\s*(\\d+)(?:\\s*[-–—]\\s*(\\d+))?`,
    "gi",
  );
  for (const match of text.matchAll(bookChapter)) {
    const start = Number.parseInt(match[1] ?? "", 10);
    const end = match[2] ? Number.parseInt(match[2], 10) : start;
    for (const v of expandSpan(start, end)) found.add(v);
  }

  // Bare "v. 16" / "vv. 3-8" in a chapter-scoped essay
  const bare = /\bvv?\.?\s*(\d+)(?:\s*[-–—]\s*(\d+))?/gi;
  for (const match of text.matchAll(bare)) {
    const start = Number.parseInt(match[1] ?? "", 10);
    const end = match[2] ? Number.parseInt(match[2], 10) : start;
    for (const v of expandSpan(start, end)) found.add(v);
  }

  const osisPrefix = `${book}.${chapter}.`;
  for (const ref of crossReferences) {
    if (!ref.startsWith(osisPrefix)) continue;
    const verse = Number.parseInt(ref.slice(osisPrefix.length), 10);
    if (Number.isFinite(verse)) found.add(verse);
  }

  return [...found].sort((a, b) => a - b);
}

/**
 * Whether a tagged entry is actually about this verse (not merely sharing a
 * wide, possibly truncated range).
 */
export function entryPertainsToVerse(
  entry: CommentaryEntry,
  book: string,
  verse: number,
): boolean {
  if (entry.verseRange === "intro") return false;
  if (!entry.verses.includes(verse)) return false;

  const cited = citedVersesInChapter(
    entry.text,
    entry.crossReferences,
    book,
    entry.chapter,
  ).filter((v) => entry.verses.includes(v));

  // Short / narrowly tagged notes: trust the declared range.
  if (cited.length === 0) {
    return entry.verses.length <= 6 || entry.text.length < 5000;
  }

  if (cited.includes(verse)) return true;

  // Section may discuss a verse before citing the next one. Keep verses from
  // the range start through the last cited verse inside the declared range
  // (drops truncated tails the source never reaches).
  const lastCited = cited[cited.length - 1] ?? 0;
  const firstInRange = entry.verses[0] ?? verse;
  return verse >= firstInRange && verse <= lastCited;
}

/** Pull the stretch of commentary that discusses this verse from a wide essay. */
export function focusCommentaryText(
  text: string,
  book: string,
  chapter: number,
  verse: number,
): string {
  const trimmed = text.trim();
  if (!trimmed) return trimmed;
  if (trimmed.length <= 1600) return trimmed;

  const abbrs = ABBR[book] ?? [book];
  const abbrAlt = abbrs.map(escapeRegExp).join("|");

  // Prefer explicit book+chapter citations as section anchors.
  const allCite = new RegExp(
    `\\b(?:${abbrAlt})\\.?\\s*${chapter}\\s*:\\s*(\\d+)(?:\\s*[-–—]\\s*(\\d+))?`,
    "gi",
  );
  type Anchor = { index: number; start: number; end: number };
  const anchors: Anchor[] = [];
  for (const match of trimmed.matchAll(allCite)) {
    if (match.index == null) continue;
    const start = Number.parseInt(match[1] ?? "", 10);
    const end = match[2] ? Number.parseInt(match[2], 10) : start;
    if (!Number.isFinite(start)) continue;
    anchors.push({
      index: match.index,
      start,
      end: Number.isFinite(end) ? end : start,
    });
  }

  const covering = anchors.filter(
    (a) => verse >= a.start && verse <= a.end,
  );
  const target =
    covering[0] ??
    anchors.find((a) => a.start === verse) ??
    null;

  if (target) {
    const next = anchors.find((a) => a.index > target.index && a.start > verse);
    const from = Math.max(0, trimmed.lastIndexOf("\n", target.index));
    const to = next
      ? next.index
      : Math.min(trimmed.length, target.index + 2200);
    const chunk = trimmed.slice(from, to).trim();
    if (chunk.length >= 80) return chunk;
  }

  // Fall back: window around bare "v. N" mention.
  const bare = new RegExp(`\\bv+\\.?\\s*${verse}\\b`, "i");
  const bareMatch = bare.exec(trimmed);
  if (bareMatch && bareMatch.index != null) {
    const from = Math.max(0, trimmed.lastIndexOf("\n", bareMatch.index));
    const to = Math.min(trimmed.length, bareMatch.index + 1800);
    return trimmed.slice(from, to).trim();
  }

  // Verse is in-range but not cited (between section markers): take the
  // nearest prior anchor through the next one.
  const prior = [...anchors].reverse().find((a) => a.start <= verse);
  if (prior) {
    const next = anchors.find((a) => a.index > prior.index);
    const from = Math.max(0, trimmed.lastIndexOf("\n", prior.index));
    const to = next
      ? next.index
      : Math.min(trimmed.length, prior.index + 1800);
    const chunk = trimmed.slice(from, to).trim();
    if (chunk.length >= 80) return chunk;
  }

  return trimmed.length <= 2500
    ? trimmed
    : `${trimmed.slice(0, 2200).trim()}…`;
}

export function focusCommentaryEntries(
  entries: CommentaryEntry[],
  book: string,
  verse: number,
): CommentaryEntry[] {
  return entries
    .filter((entry) => entryPertainsToVerse(entry, book, verse))
    .map((entry) => {
      const focused = focusCommentaryText(
        entry.text,
        book,
        entry.chapter,
        verse,
      );
      return {
        ...entry,
        text: focused,
        excerpt: focused.replace(/\s+/g, " ").trim().slice(0, 280),
        wordCount: focused.split(/\s+/).filter(Boolean).length,
      };
    })
    .sort((a, b) => {
      // Narrower declared ranges first, then earlier starts.
      const spanA = a.verses.length || 99;
      const spanB = b.verses.length || 99;
      if (spanA !== spanB) return spanA - spanB;
      return (a.verses[0] ?? 0) - (b.verses[0] ?? 0);
    });
}

/** Verses inside a declared range that the stored text actually supports. */
export function versesCoveredByEntryText(
  declaredVerses: number[],
  text: string,
  crossReferences: string[],
  book: string,
  chapter: number,
): number[] {
  if (declaredVerses.length === 0) return [];
  const declared = new Set(declaredVerses);
  const cited = citedVersesInChapter(text, crossReferences, book, chapter).filter(
    (v) => declared.has(v),
  );
  if (cited.length === 0) {
    if (declaredVerses.length <= 6 || text.length < 5000) return declaredVerses;
    // Long essay with no verse pins: keep only the opening stretch.
    return declaredVerses.slice(0, Math.min(declaredVerses.length, 4));
  }
  const lastCited = cited[cited.length - 1] ?? declaredVerses[0]!;
  return declaredVerses.filter((v) => v <= lastCited);
}
