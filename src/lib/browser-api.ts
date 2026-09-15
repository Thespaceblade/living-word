import { focusCommentaryEntries } from "@/lib/commentary-focus";
import { SEARCH_TOPICS, type SearchHit, type SearchMode, type SearchResponse } from "@/lib/search-shared";
import { dataUrl, isStaticExport, withBase } from "@/lib/site";
import type {
  BibleBook,
  BibleVerse,
  CommentaryBundle,
  CommentaryEntry,
  IntelPayload,
  VerseRef,
  VerseWords,
} from "@/lib/types";
import type { LexiconPayload } from "@/lib/lexicon";
import type { XrefItem } from "@/lib/xref-shared";
import { parseXref } from "@/lib/xref-shared";

type CacheEntry = { at: number; data: unknown };
const cache = new Map<string, CacheEntry>();
const CACHE_MS = 1000 * 60 * 30;

async function fetchJson<T>(url: string, signal?: AbortSignal): Promise<T> {
  const hit = cache.get(url);
  if (hit && Date.now() - hit.at < CACHE_MS) return hit.data as T;
  const res = await fetch(url, { signal });
  if (!res.ok) throw new Error(`Failed ${res.status} for ${url}`);
  const data = (await res.json()) as T;
  cache.set(url, { at: Date.now(), data });
  return data;
}

function normalizeStrongs(raw: string): string | null {
  const cleaned = raw.trim().toUpperCase().replace(/^STRONG'?S?\s*/i, "");
  const match = cleaned.match(/^([HG])?0*(\d{1,5})$/);
  if (!match) return null;
  const num = match[2];
  if (!num) return null;
  const prefix = match[1] ?? (Number(num) >= 4000 ? "G" : "H");
  return `${prefix}${Number(num)}`;
}

async function loadBible(version: string, slug: string, signal?: AbortSignal) {
  return fetchJson<BibleBook>(dataUrl("bible", version, `${slug}.json`), signal);
}

async function loadCommentary(slug: string, signal?: AbortSignal) {
  return fetchJson<CommentaryBundle>(
    dataUrl("commentary", `${slug}.json`),
    signal,
  );
}

export async function apiGetChapter(
  version: string,
  slug: string,
  chapter: number,
  signal?: AbortSignal,
): Promise<{
  book: string;
  slug: string;
  version: string;
  chapter: number;
  verses: BibleVerse[];
}> {
  if (!isStaticExport()) {
    const params = new URLSearchParams({
      version,
      slug,
      chapter: String(chapter),
    });
    const res = await fetch(withBase(`/api/chapter?${params}`), { signal });
    if (!res.ok) throw new Error("Chapter not found");
    return res.json();
  }

  const bible = await loadBible(version, slug, signal);
  const ch = bible.chapters.find((c) => c.chapter === chapter);
  if (!ch) throw new Error("Chapter not found");
  return {
    book: bible.book,
    slug: bible.slug,
    version: bible.version,
    chapter: ch.chapter,
    verses: ch.verses,
  };
}

export async function apiGetIntel(
  ref: VerseRef,
  version: string,
  signal?: AbortSignal,
): Promise<IntelPayload> {
  if (!isStaticExport()) {
    const params = new URLSearchParams({
      version,
      slug: ref.slug,
      book: ref.book,
      chapter: String(ref.chapter),
      verse: String(ref.verse),
    });
    const res = await fetch(withBase(`/api/intel?${params}`), { signal });
    if (!res.ok) throw new Error("Verse not found");
    return res.json();
  }

  const bible = await loadBible(version, ref.slug, signal);
  const chapter = bible.chapters.find((c) => c.chapter === ref.chapter);
  const verse = chapter?.verses.find((v) => v.verse === ref.verse);
  if (!chapter || !verse) throw new Error("Verse not found");

  const commentary = await loadCommentary(ref.slug, signal);
  const key = `${bible.book}.${ref.chapter}.${ref.verse}`;
  const ids = commentary.byVerse[key] ?? [];
  const tagged = ids
    .map((id) => commentary.entries[id])
    .filter(Boolean) as CommentaryEntry[];
  const entries = focusCommentaryEntries(tagged, bible.book, ref.verse);

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
    bookIntro: null,
  };
}

export async function apiGetWords(
  slug: string,
  chapter: number,
  verse: number,
  signal?: AbortSignal,
): Promise<VerseWords> {
  if (!isStaticExport()) {
    const params = new URLSearchParams({
      slug,
      chapter: String(chapter),
      verse: String(verse),
    });
    const res = await fetch(withBase(`/api/words?${params}`), { signal });
    if (!res.ok) throw new Error("No word study for this verse yet");
    return res.json();
  }

  type WordsBundle = {
    slug: string;
    lang: "hebrew" | "greek";
    source: string;
    license: string;
    attribution: string;
    chapters: Record<string, Record<string, VerseWords["tokens"]>>;
  };
  const bundle = await fetchJson<WordsBundle>(
    dataUrl("words", `${slug}.json`),
    signal,
  );
  const tokens = bundle.chapters[String(chapter)]?.[String(verse)];
  if (!tokens?.length) throw new Error("No word study for this verse yet");
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

export async function apiGetCompare(
  slug: string,
  chapter: number,
  verse: number,
  signal?: AbortSignal,
): Promise<{
  slug: string;
  chapter: number;
  verse: number;
  parallels: {
    id: string;
    label: string;
    name: string;
    text: string | null;
    ready: boolean;
  }[];
}> {
  if (!isStaticExport()) {
    const params = new URLSearchParams({
      slug,
      chapter: String(chapter),
      verse: String(verse),
    });
    const res = await fetch(withBase(`/api/compare?${params}`), { signal });
    if (!res.ok) throw new Error("Verse not found");
    return res.json();
  }

  const catalog = await fetchJson<{
    versions: { id: string; label: string; name: string }[];
  }>(dataUrl("catalog.json"), signal);

  const parallels = await Promise.all(
    catalog.versions.map(async (version) => {
      try {
        const bible = await loadBible(version.id, slug, signal);
        const text =
          bible.chapters
            .find((c) => c.chapter === chapter)
            ?.verses.find((v) => v.verse === verse)?.text ?? null;
        return {
          id: version.id,
          label: version.label,
          name: version.name,
          text,
          ready: true,
        };
      } catch {
        return {
          id: version.id,
          label: version.label,
          name: version.name,
          text: null,
          ready: true,
        };
      }
    }),
  );

  if (parallels.every((p) => !p.text)) throw new Error("Verse not found");
  return { slug, chapter, verse, parallels };
}

export async function apiGetXrefs(
  version: string,
  ref: VerseRef,
  signal?: AbortSignal,
): Promise<{ items: XrefItem[] }> {
  if (!isStaticExport()) {
    const params = new URLSearchParams({
      version,
      slug: ref.slug,
      book: ref.book,
      chapter: String(ref.chapter),
      verse: String(ref.verse),
    });
    const res = await fetch(withBase(`/api/xrefs?${params}`), { signal });
    if (!res.ok) throw new Error("Could not load cross-references");
    return res.json();
  }

  const intel = await apiGetIntel(ref, version, signal);
  const seen = new Set<string>();
  const items: XrefItem[] = [];

  for (const entry of intel.entries) {
    for (const raw of entry.crossReferences ?? []) {
      const parsed = parseXref(raw);
      if (!parsed || seen.has(parsed.raw)) continue;
      seen.add(parsed.raw);
      const slug = parsed.slug;
      let text: string | null = null;
      let jumpable = false;
      if (slug) {
        try {
          const bible = await loadBible(version, slug, signal);
          text =
            bible.chapters
              .find((c) => c.chapter === parsed.chapter)
              ?.verses.find((v) => v.verse === parsed.verse)?.text ?? null;
          jumpable = Boolean(text);
        } catch {
          jumpable = false;
        }
      }
      if (slug && !text) continue;
      items.push({
        raw: parsed.raw,
        label: parsed.label,
        slug: slug ?? null,
        chapter: parsed.chapter,
        verse: parsed.verse,
        text: text ? text.replace(/\s+/g, " ").trim().slice(0, 140) : null,
        jumpable,
      });
    }
  }

  return { items };
}

export async function apiGetLexicon(
  strongs: string,
  version: string,
  options?: { exclude?: string; limit?: number; signal?: AbortSignal },
): Promise<LexiconPayload> {
  const signal = options?.signal;
  if (!isStaticExport()) {
    const params = new URLSearchParams({
      strongs,
      version,
      limit: String(options?.limit ?? 24),
    });
    if (options?.exclude) params.set("exclude", options.exclude);
    const res = await fetch(withBase(`/api/lexicon?${params}`), { signal });
    if (!res.ok) throw new Error("Unknown Strongs number");
    return res.json();
  }

  const id = normalizeStrongs(strongs);
  if (!id) throw new Error("Unknown Strongs number");
  const lang = id.startsWith("G") ? "greek" : "hebrew";
  type LexBundle = {
    lang: "hebrew" | "greek";
    source: string;
    license: string;
    attribution: string;
    entries: Record<
      string,
      {
        id: string;
        lemma: string;
        translit: string;
        pronunciation: string;
        derivation: string;
        strongsDef: string;
        kjvDef: string;
      }
    >;
  };
  const bundle = await fetchJson<LexBundle>(
    dataUrl("lexicon", `${lang}.json`),
    signal,
  );
  const entryRaw = bundle.entries[id];
  const entry = entryRaw
    ? {
        ...entryRaw,
        lang: bundle.lang,
        source: bundle.source,
        license: bundle.license,
        attribution: bundle.attribution,
      }
    : null;

  type ConcHit = {
    b: string;
    s: string;
    c: number;
    v: number;
    g: string;
    t: string;
  };
  const concordance = await fetchJson<Record<string, ConcHit[]>>(
    dataUrl("lexicon", "concordance.json"),
    signal,
  );
  const exclude = options?.exclude ?? "";
  const limit = Math.min(Math.max(options?.limit ?? 24, 1), 80);
  const filtered = (concordance[id] ?? []).filter(
    (hit) => `${hit.s}:${hit.c}:${hit.v}` !== exclude,
  );

  const occurrences = await Promise.all(
    filtered.slice(0, limit).map(async (hit) => {
      let text = "";
      try {
        const bible = await loadBible(version, hit.s, signal);
        text =
          bible.chapters
            .find((c) => c.chapter === hit.c)
            ?.verses.find((v) => v.verse === hit.v)?.text ?? "";
      } catch {
        text = "";
      }
      return {
        book: hit.b,
        slug: hit.s,
        chapter: hit.c,
        verse: hit.v,
        text,
        gloss: hit.g,
        tlit: hit.t,
      };
    }),
  );

  return {
    strongs: id,
    entry,
    occurrences,
    total: filtered.length,
  };
}

export async function apiSearch(
  query: string,
  version: string,
  options?: { mode?: string | null; limit?: number; signal?: AbortSignal },
): Promise<SearchResponse> {
  const signal = options?.signal;
  if (!isStaticExport()) {
    const params = new URLSearchParams({
      q: query,
      version,
    });
    if (options?.mode) params.set("mode", options.mode);
    if (options?.limit) params.set("limit", String(options.limit));
    const res = await fetch(withBase(`/api/search?${params}`), { signal });
    if (!res.ok) throw new Error("Search failed");
    return res.json();
  }

  const q = query.trim();
  const limit = Math.min(Math.max(options?.limit ?? 40, 1), 100);
  let mode: SearchMode = "text";
  if (options?.mode === "text" || options?.mode === "strongs" || options?.mode === "topic") {
    mode = options.mode;
  } else if (normalizeStrongs(q)) {
    mode = "strongs";
  } else if (
    SEARCH_TOPICS.some((t) => t.query.toLowerCase() === q.toLowerCase())
  ) {
    mode = "topic";
  }

  if (mode === "strongs") {
    const id = normalizeStrongs(q);
    if (!id) {
      return { query: q, mode, version, total: 0, results: [] };
    }
    const concordance = await fetchJson<
      Record<
        string,
        { b: string; s: string; c: number; v: number; g: string; t: string }[]
      >
    >(dataUrl("lexicon", "concordance.json"), signal);
    const hits = concordance[id] ?? [];
    const results: SearchHit[] = [];
    for (const hit of hits.slice(0, limit)) {
      let text = "";
      try {
        const bible = await loadBible(version, hit.s, signal);
        text =
          bible.chapters
            .find((c) => c.chapter === hit.c)
            ?.verses.find((v) => v.verse === hit.v)?.text ?? "";
      } catch {
        text = "";
      }
      results.push({
        book: hit.b,
        slug: hit.s,
        chapter: hit.c,
        verse: hit.v,
        text,
        match: "strongs",
        strongs: id,
        gloss: hit.g,
        tlit: hit.t,
      });
    }
    return { query: q, mode, version, total: hits.length, results };
  }

  const topic =
    SEARCH_TOPICS.find((t) => t.query.toLowerCase() === q.toLowerCase()) ??
    null;
  const needle = (topic?.query ?? q).toLowerCase();
  type CompactVerse = { b: string; s: string; c: number; v: number; t: string };
  const verses = await fetchJson<CompactVerse[]>(
    dataUrl("search", `${version}.json`),
    signal,
  );
  const matched = verses.filter((verse) =>
    verse.t.toLowerCase().includes(needle),
  );
  const results: SearchHit[] = matched.slice(0, limit).map((verse) => ({
    book: verse.b,
    slug: verse.s,
    chapter: verse.c,
    verse: verse.v,
    text: verse.t,
    match: mode === "topic" ? "topic" : "text",
  }));
  return {
    query: q,
    mode,
    version,
    total: matched.length,
    results,
  };
}
