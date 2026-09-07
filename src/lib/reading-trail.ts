export type TrailPlace = {
  version: string;
  book: string;
  slug: string;
  chapter: number;
  verse: number;
};

const STORAGE_KEY = "lw-trail";
const MAX_DEPTH = 8;
const listeners = new Set<() => void>();

const EMPTY: TrailPlace[] = [];
let cachedRaw: string | null = null;
let cachedStack: TrailPlace[] = EMPTY;

function readStack(): TrailPlace[] {
  if (typeof window === "undefined") return EMPTY;
  try {
    const raw = window.sessionStorage.getItem(STORAGE_KEY);
    if (raw === cachedRaw) return cachedStack;
    cachedRaw = raw;
    if (!raw) {
      cachedStack = EMPTY;
      return EMPTY;
    }
    const parsed = JSON.parse(raw) as TrailPlace[];
    cachedStack = Array.isArray(parsed) ? parsed : EMPTY;
    return cachedStack;
  } catch {
    cachedRaw = null;
    cachedStack = EMPTY;
    return EMPTY;
  }
}

function writeStack(next: TrailPlace[]) {
  const trimmed = next.slice(-MAX_DEPTH);
  const raw = trimmed.length ? JSON.stringify(trimmed) : null;
  if (raw) window.sessionStorage.setItem(STORAGE_KEY, raw);
  else window.sessionStorage.removeItem(STORAGE_KEY);
  cachedRaw = raw;
  cachedStack = trimmed.length ? trimmed : EMPTY;
  listeners.forEach((listener) => listener());
}

export function getTrailSnapshot(): TrailPlace[] {
  return readStack();
}

export function getServerTrailSnapshot(): TrailPlace[] {
  return EMPTY;
}

export function subscribeTrail(onStoreChange: () => void) {
  listeners.add(onStoreChange);
  return () => listeners.delete(onStoreChange);
}

export function peekTrail(): TrailPlace | null {
  const stack = readStack();
  return stack[stack.length - 1] ?? null;
}

export function pushTrail(place: TrailPlace) {
  const stack = readStack();
  const top = stack[stack.length - 1];
  if (
    top &&
    top.version === place.version &&
    top.slug === place.slug &&
    top.chapter === place.chapter &&
    top.verse === place.verse
  ) {
    return;
  }
  writeStack([...stack, place]);
}

export function popTrail(): TrailPlace | null {
  const stack = readStack();
  if (stack.length === 0) return null;
  const top = stack[stack.length - 1];
  writeStack(stack.slice(0, -1));
  return top;
}

export function clearTrail() {
  writeStack([]);
}

export function formatTrailLabel(place: TrailPlace) {
  return `${place.book} ${place.chapter}:${place.verse}`;
}
