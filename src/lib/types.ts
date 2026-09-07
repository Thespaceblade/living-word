export type BibleVersion = {
  id: string;
  label: string;
  name: string;
};

export type CatalogBook = {
  book: string;
  slug: string;
  chapters: number;
  commentaryEntries: number;
  taggedVerses: number;
  license: string;
  author: string;
};

export type Catalog = {
  versions: BibleVersion[];
  books: CatalogBook[];
  generatedAt: string;
};

export type BibleVerse = {
  verse: number;
  text: string;
};

export type BibleChapter = {
  chapter: number;
  verses: BibleVerse[];
};

export type BibleBook = {
  book: string;
  slug: string;
  version: string;
  chapters: BibleChapter[];
};

export type CommentaryEntry = {
  id: string;
  source: string;
  author: string;
  chapter: number;
  verseRange: string;
  verses: number[];
  crossReferences: string[];
  wordCount: number | null;
  excerpt: string;
  text: string;
};

export type CommentaryBundle = {
  book: string;
  slug: string;
  meta: {
    id: string;
    title: string;
    author: string;
    license: string;
    source: string;
  };
  bookIntroId: string | null;
  byChapterIntro: Record<string, string[]>;
  byVerse: Record<string, string[]>;
  entries: Record<string, CommentaryEntry>;
};

export type VerseRef = {
  book: string;
  slug: string;
  chapter: number;
  verse: number;
};

export type IntelPayload = {
  ref: VerseRef;
  verseText: string;
  meta: CommentaryBundle["meta"];
  entries: CommentaryEntry[];
  bookIntro: CommentaryEntry | null;
};

export type LayoutMode = "single" | "dual";

export type WordToken = {
  i: number;
  surface: string;
  tlit: string;
  strongs: string;
  gloss: string;
};

export type VerseWords = {
  slug: string;
  chapter: number;
  verse: number;
  lang: "hebrew" | "greek";
  tokens: WordToken[];
  source: string;
  license: string;
  attribution: string;
};
