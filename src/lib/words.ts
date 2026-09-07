import fs from "node:fs";
import path from "node:path";
import type { VerseWords, WordToken } from "./types";

const PROCESSED = path.join(process.cwd(), "data/processed/words");

type WordsBundle = {
  slug: string;
  lang: "hebrew" | "greek";
  source: string;
  license: string;
  attribution: string;
  chapters: Record<string, Record<string, WordToken[]>>;
};

function readBundle(slug: string): WordsBundle | null {
  const file = path.join(PROCESSED, `${slug}.json`);
  if (!fs.existsSync(file)) return null;
  return JSON.parse(fs.readFileSync(file, "utf8")) as WordsBundle;
}

export function getVerseWords(
  slug: string,
  chapter: number,
  verse: number,
): VerseWords | null {
  const bundle = readBundle(slug);
  if (!bundle) return null;
  const tokens = bundle.chapters[String(chapter)]?.[String(verse)];
  if (!tokens || tokens.length === 0) return null;
  return {
    slug,
    chapter,
    verse,
    lang: bundle.lang,
    tokens,
    source: bundle.source,
    license: bundle.license,
    attribution: bundle.attribution,
  };
}
