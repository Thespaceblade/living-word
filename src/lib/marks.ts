export type HighlightColor =
  | "yellow"
  | "green"
  | "blue"
  | "pink"
  | "orange"
  | null;

export type VerseMark = {
  key: string;
  slug: string;
  book: string;
  chapter: number;
  verse: number;
  highlight: HighlightColor;
  bookmarked: boolean;
  note: string;
  updatedAt: string;
};

export type MarksStore = Record<string, VerseMark>;

export const HIGHLIGHT_COLORS: Exclude<HighlightColor, null>[] = [
  "yellow",
  "green",
  "blue",
  "pink",
  "orange",
];

const STORAGE_KEY = "lw-marks-v1";
const listeners = new Set<() => void>();
const EMPTY_STORE: MarksStore = Object.freeze({}) as MarksStore;

let cachedRaw: string | null = null;
let cachedStore: MarksStore = EMPTY_STORE;

export function markKey(slug: string, chapter: number, verse: number) {
  return `${slug}.${chapter}.${verse}`;
}

export function getMarksSnapshot(): MarksStore {
  if (typeof window === "undefined") return EMPTY_STORE;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw === cachedRaw) return cachedStore;
    cachedRaw = raw;
    cachedStore = raw ? (JSON.parse(raw) as MarksStore) : EMPTY_STORE;
    return cachedStore;
  } catch {
    cachedRaw = null;
    cachedStore = EMPTY_STORE;
    return EMPTY_STORE;
  }
}

export function getServerMarksSnapshot(): MarksStore {
  return EMPTY_STORE;
}

export function subscribeMarks(onStoreChange: () => void) {
  listeners.add(onStoreChange);
  const onStorage = (event: StorageEvent) => {
    if (event.key === STORAGE_KEY) {
      cachedRaw = null;
      onStoreChange();
    }
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(onStoreChange);
    window.removeEventListener("storage", onStorage);
  };
}

function writeStore(next: MarksStore) {
  const raw = JSON.stringify(next);
  window.localStorage.setItem(STORAGE_KEY, raw);
  cachedRaw = raw;
  cachedStore = Object.keys(next).length === 0 ? EMPTY_STORE : next;
  listeners.forEach((listener) => listener());
}

function upsert(
  store: MarksStore,
  input: {
    slug: string;
    book: string;
    chapter: number;
    verse: number;
  },
  patch: Partial<Pick<VerseMark, "highlight" | "bookmarked" | "note">>,
): MarksStore {
  const key = markKey(input.slug, input.chapter, input.verse);
  const prev = store[key];
  const nextMark: VerseMark = {
    key,
    slug: input.slug,
    book: input.book,
    chapter: input.chapter,
    verse: input.verse,
    highlight: patch.highlight !== undefined ? patch.highlight : (prev?.highlight ?? null),
    bookmarked:
      patch.bookmarked !== undefined
        ? patch.bookmarked
        : (prev?.bookmarked ?? false),
    note: patch.note !== undefined ? patch.note : (prev?.note ?? ""),
    updatedAt: new Date().toISOString(),
  };

  const next = { ...store, [key]: nextMark };
  const isEmpty =
    !nextMark.highlight && !nextMark.bookmarked && !nextMark.note.trim();
  if (isEmpty) {
    delete next[key];
  }
  return next;
}

export function setHighlight(
  input: { slug: string; book: string; chapter: number; verse: number },
  color: HighlightColor,
) {
  writeStore(upsert(getMarksSnapshot(), input, { highlight: color }));
}

export function toggleBookmark(input: {
  slug: string;
  book: string;
  chapter: number;
  verse: number;
}) {
  const key = markKey(input.slug, input.chapter, input.verse);
  const current = getMarksSnapshot()[key]?.bookmarked ?? false;
  writeStore(upsert(getMarksSnapshot(), input, { bookmarked: !current }));
}

export function setNote(
  input: { slug: string; book: string; chapter: number; verse: number },
  note: string,
) {
  writeStore(upsert(getMarksSnapshot(), input, { note }));
}

export function getMark(
  store: MarksStore,
  slug: string,
  chapter: number,
  verse: number,
): VerseMark | null {
  return store[markKey(slug, chapter, verse)] ?? null;
}
