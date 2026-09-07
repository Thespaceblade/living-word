export type SearchMode = "text" | "strongs" | "topic";

export type SearchHit = {
  book: string;
  slug: string;
  chapter: number;
  verse: number;
  text: string;
  match: SearchMode;
  strongs?: string;
  gloss?: string;
  tlit?: string;
};

export type SearchResponse = {
  query: string;
  mode: SearchMode;
  version: string;
  total: number;
  results: SearchHit[];
};

export type TopicItem = {
  id: string;
  label: string;
  query: string;
};

/** Curated themes that hit well in Genesis / Psalms / John. */
export const SEARCH_TOPICS: TopicItem[] = [
  { id: "love", label: "Love", query: "love" },
  { id: "light", label: "Light", query: "light" },
  { id: "faith", label: "Faith", query: "believe" },
  { id: "word", label: "The Word", query: "word" },
  { id: "creation", label: "Creation", query: "created" },
  { id: "shepherd", label: "Shepherd", query: "shepherd" },
  { id: "water", label: "Water", query: "water" },
  { id: "life", label: "Life", query: "life" },
  { id: "fear", label: "Fear of the Lord", query: "fear the lord" },
  { id: "bless", label: "Blessing", query: "bless" },
];
