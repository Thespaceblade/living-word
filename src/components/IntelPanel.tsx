"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, useSyncExternalStore } from "react";
import {
  HIGHLIGHT_COLORS,
  type HighlightColor,
  type VerseMark,
  setHighlight,
  setNote,
  toggleBookmark,
} from "@/lib/marks";
import type {
  CommentaryEntry,
  IntelPayload,
  VerseRef,
  VerseWords,
} from "@/lib/types";

export type StudyTabId =
  | "study"
  | "words"
  | "compare"
  | "xrefs"
  | "notes"
  | "marks";

type CompareRow = {
  id: string;
  label: string;
  name: string;
  text: string | null;
};

const TABS: { id: StudyTabId; label: string }[] = [
  { id: "study", label: "Study" },
  { id: "words", label: "Words" },
  { id: "compare", label: "Compare" },
  { id: "xrefs", label: "Cross-refs" },
  { id: "notes", label: "Notes" },
  { id: "marks", label: "Marks" },
];

const TAB_KEY = "lw-study-tab";
const tabListeners = new Set<() => void>();

/** Abbrs that resolve into the current corpus (Genesis, Psalms, John). */
const ABBR_TO_SLUG: Record<string, string> = {
  gen: "genesis",
  ge: "genesis",
  gn: "genesis",
  genesis: "genesis",
  ps: "psalms",
  psa: "psalms",
  pss: "psalms",
  psalm: "psalms",
  psalms: "psalms",
  john: "john",
  jhn: "john",
  jn: "john",
  joh: "john",
};

function parseXref(ref: string): {
  slug: string | null;
  label: string;
  chapter: number;
  verse: number;
} | null {
  const match = ref.trim().match(/^([A-Za-z0-9]+)\.(\d+)\.(\d+)$/);
  if (!match) return null;
  const abbr = match[1];
  const chapter = Number(match[2]);
  const verse = Number(match[3]);
  return {
    slug: ABBR_TO_SLUG[abbr.toLowerCase()] ?? null,
    label: `${abbr} ${chapter}:${verse}`,
    chapter,
    verse,
  };
}

function entryLabel(entry: CommentaryEntry) {
  const isIntro = entry.verseRange === "intro";
  if (isIntro) {
    return entry.chapter === 0
      ? "Book introduction"
      : `Chapter ${entry.chapter} overview`;
  }
  return `On vv. ${entry.verseRange}`;
}

function readSavedTab(): StudyTabId {
  if (typeof window === "undefined") return "study";
  const saved = window.localStorage.getItem(TAB_KEY);
  if (TABS.some((t) => t.id === saved)) return saved as StudyTabId;
  return "study";
}

function subscribeSavedTab(onStoreChange: () => void) {
  tabListeners.add(onStoreChange);
  return () => tabListeners.delete(onStoreChange);
}

export function preferStudyTab(tab: StudyTabId) {
  window.localStorage.setItem(TAB_KEY, tab);
  tabListeners.forEach((listener) => listener());
}

type Props = {
  version: string;
  selected: VerseRef | null;
  verseText: string | null;
  mark: VerseMark | null;
  availableSlugs: string[];
  onXrefNavigate?: () => void;
  onClose: () => void;
};

export function IntelPanel({
  version,
  selected,
  verseText,
  mark,
  availableSlugs,
  onXrefNavigate,
  onClose,
}: Props) {
  const tab = useSyncExternalStore(
    subscribeSavedTab,
    readSavedTab,
    () => "study" as StudyTabId,
  );

  const intelKey = selected
    ? `${version}:${selected.slug}:${selected.chapter}:${selected.verse}`
    : null;
  const compareKey =
    selected && tab === "compare"
      ? `${selected.slug}:${selected.chapter}:${selected.verse}`
      : null;
  const wordsKey =
    selected && tab === "words"
      ? `${selected.slug}:${selected.chapter}:${selected.verse}`
      : null;

  const [intelResult, setIntelResult] = useState<{
    key: string;
    data?: IntelPayload;
    error?: string;
  } | null>(null);
  const [compareResult, setCompareResult] = useState<{
    key: string;
    rows?: CompareRow[];
    error?: string;
  } | null>(null);
  const [wordsResult, setWordsResult] = useState<{
    key: string;
    data?: VerseWords;
    error?: string;
  } | null>(null);

  const [noteDraft, setNoteDraft] = useState(mark?.note ?? "");

  useEffect(() => {
    if (!selected || !intelKey) return;

    const controller = new AbortController();
    const params = new URLSearchParams({
      version,
      slug: selected.slug,
      book: selected.book,
      chapter: String(selected.chapter),
      verse: String(selected.verse),
    });

    fetch(`/api/intel?${params}`, { signal: controller.signal })
      .then(async (res) => {
        if (!res.ok) throw new Error("Failed to load study notes");
        return (await res.json()) as IntelPayload;
      })
      .then((data) => {
        setIntelResult({ key: intelKey, data });
      })
      .catch((err: Error) => {
        if (err.name === "AbortError") return;
        setIntelResult({
          key: intelKey,
          error: "Could not load commentary for this verse.",
        });
      });

    return () => controller.abort();
  }, [selected, version, intelKey]);

  useEffect(() => {
    if (!selected || !compareKey) return;

    const controller = new AbortController();
    const params = new URLSearchParams({
      slug: selected.slug,
      chapter: String(selected.chapter),
      verse: String(selected.verse),
    });

    fetch(`/api/compare?${params}`, { signal: controller.signal })
      .then(async (res) => {
        if (!res.ok) throw new Error("Failed to load parallels");
        return (await res.json()) as { parallels: CompareRow[] };
      })
      .then((json) => {
        setCompareResult({ key: compareKey, rows: json.parallels });
      })
      .catch((err: Error) => {
        if (err.name === "AbortError") return;
        setCompareResult({
          key: compareKey,
          rows: [],
          error: "Could not load parallel translations.",
        });
      });

    return () => controller.abort();
  }, [selected, compareKey]);

  useEffect(() => {
    if (!selected || !wordsKey) return;

    const controller = new AbortController();
    const params = new URLSearchParams({
      slug: selected.slug,
      chapter: String(selected.chapter),
      verse: String(selected.verse),
    });

    fetch(`/api/words?${params}`, { signal: controller.signal })
      .then(async (res) => {
        if (!res.ok) throw new Error("Failed to load words");
        return (await res.json()) as VerseWords;
      })
      .then((data) => {
        setWordsResult({ key: wordsKey, data });
      })
      .catch((err: Error) => {
        if (err.name === "AbortError") return;
        setWordsResult({
          key: wordsKey,
          error: "No transliteration for this verse yet.",
        });
      });

    return () => controller.abort();
  }, [selected, wordsKey]);

  const intel =
    intelResult && intelResult.key === intelKey ? intelResult : null;
  const compare =
    compareResult && compareResult.key === compareKey ? compareResult : null;
  const words =
    wordsResult && wordsResult.key === wordsKey ? wordsResult : null;
  const intelLoading = Boolean(intelKey) && !intel;
  const compareLoading = Boolean(compareKey) && !compare;
  const wordsLoading = Boolean(wordsKey) && !words;

  const crossRefs = useMemo(() => {
    const refs = new Set<string>();
    for (const entry of intel?.data?.entries ?? []) {
      for (const ref of entry.crossReferences) refs.add(ref);
    }
    return Array.from(refs);
  }, [intel]);

  const open = Boolean(selected);
  const markInput = selected
    ? {
        slug: selected.slug,
        book: selected.book,
        chapter: selected.chapter,
        verse: selected.verse,
      }
    : null;

  function copyCitation() {
    if (!selected || !verseText) return;
    const citation = `${selected.book} ${selected.chapter}:${selected.verse} ${version.toUpperCase()}\n${verseText}`;
    void navigator.clipboard.writeText(citation);
  }

  function saveNote() {
    if (!markInput) return;
    setNote(markInput, noteDraft);
  }

  function applyHighlight(color: HighlightColor) {
    if (!markInput) return;
    setHighlight(markInput, color);
  }

  function applyBookmark() {
    if (!markInput) return;
    toggleBookmark(markInput);
  }

  return (
    <aside
      className={`intel-panel ${open ? "intel-panel--open" : ""}`}
      aria-hidden={!open}
    >
      <div className="intel-panel__inner">
        <header className="intel-panel__header">
          <div>
            <p className="eyebrow">Selected verse</p>
            <h2>
              {selected
                ? `${selected.book} ${selected.chapter}:${selected.verse}`
                : "Choose a verse"}
            </h2>
          </div>
          <button type="button" className="ghost-btn" onClick={onClose}>
            Close
          </button>
        </header>

        {selected ? (
          <>
            {verseText ? (
              <blockquote className="verse-quote">“{verseText}”</blockquote>
            ) : null}

            <div className="study-tabs" role="tablist" aria-label="Study tools">
              {TABS.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  role="tab"
                  aria-selected={tab === item.id}
                  className={`study-tab ${tab === item.id ? "is-active" : ""}`}
                  onClick={() => preferStudyTab(item.id)}
                >
                  {item.label}
                </button>
              ))}
            </div>

            <div className="study-tab-panel" role="tabpanel">
              {tab === "study" && (
                <>
                  {intelLoading && (
                    <p className="muted">Gathering commentary…</p>
                  )}
                  {intel?.error && <p className="error">{intel.error}</p>}
                  {intel?.data ? (
                    <p className="muted source-line">
                      Source · {intel.data.meta.title} ({intel.data.meta.license})
                    </p>
                  ) : null}
                  {!intelLoading &&
                    !intel?.error &&
                    intel?.data &&
                    intel.data.entries.length === 0 && (
                      <p className="muted">
                        No commentary tagged for this verse yet.
                      </p>
                    )}
                  {intel?.data?.entries.map((entry) => (
                    <article key={entry.id} className="intel-entry">
                      <header className="intel-entry__head">
                        <span className="intel-entry__label">
                          {entryLabel(entry)}
                        </span>
                        <span className="intel-entry__meta">
                          {entry.author}
                          {entry.wordCount
                            ? ` · ${entry.wordCount.toLocaleString()} words`
                            : ""}
                        </span>
                      </header>
                      <p className="intel-entry__body">{entry.text}</p>
                    </article>
                  ))}
                </>
              )}

              {tab === "words" && (
                <WordsTab
                  loading={wordsLoading}
                  error={words?.error}
                  data={words?.data}
                />
              )}

              {tab === "compare" && (
                <>
                  {compareLoading && (
                    <p className="muted">Loading parallels…</p>
                  )}
                  {compare?.error && <p className="error">{compare.error}</p>}
                  {!compareLoading &&
                    !compare?.error &&
                    compare?.rows &&
                    compare.rows.length === 0 && (
                      <p className="muted">
                        No parallel texts available for this verse.
                      </p>
                    )}
                  {compare?.rows && compare.rows.length > 0 && (
                    <div className="compare-list">
                      {compare.rows.map((row) => (
                        <article key={row.id} className="compare-card">
                          <header>
                            <h3>{row.label}</h3>
                            {row.id === version ? <span>Current</span> : null}
                          </header>
                          <p className="compare-card__name">{row.name}</p>
                          <p>
                            {row.text ?? "Not available in this corpus yet."}
                          </p>
                        </article>
                      ))}
                    </div>
                  )}
                </>
              )}

              {tab === "xrefs" && (
                <>
                  {intelLoading && (
                    <p className="muted">Loading references…</p>
                  )}
                  {!intelLoading && crossRefs.length === 0 && (
                    <p className="muted">
                      No cross-references attached to this verse yet.
                    </p>
                  )}
                  <ul className="xref-list">
                    {crossRefs.map((ref) => {
                      const parsed = parseXref(ref);
                      if (!parsed) {
                        return (
                          <li key={ref}>
                            <span className="xref-row xref-row--plain">
                              {ref}
                            </span>
                          </li>
                        );
                      }
                      const canJump =
                        parsed.slug != null &&
                        availableSlugs.includes(parsed.slug);
                      if (!canJump || !parsed.slug) {
                        return (
                          <li key={ref}>
                            <span className="xref-row xref-row--locked">
                              <span>{parsed.label}</span>
                              <em>Not in library</em>
                            </span>
                          </li>
                        );
                      }
                      return (
                        <li key={ref}>
                          <Link
                            className="xref-row xref-row--jump"
                            href={`/read/${version}/${parsed.slug}/${parsed.chapter}?verse=${parsed.verse}`}
                            onClick={() => {
                              onXrefNavigate?.();
                              onClose();
                            }}
                          >
                            {parsed.label}
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                </>
              )}

              {tab === "notes" && (
                <div className="notes-editor">
                  <label htmlFor="verse-note">Personal note</label>
                  <textarea
                    id="verse-note"
                    value={noteDraft}
                    onChange={(event) => setNoteDraft(event.target.value)}
                    placeholder="Write a short reflection anchored to this verse…"
                    rows={8}
                  />
                  <div className="notes-actions">
                    <button
                      type="button"
                      className="primary-btn"
                      onClick={saveNote}
                    >
                      Save note
                    </button>
                    {mark?.note?.trim() && mark.updatedAt ? (
                      <span className="muted tiny">
                        Updated {new Date(mark.updatedAt).toLocaleString()}
                      </span>
                    ) : null}
                  </div>
                </div>
              )}

              {tab === "marks" && (
                <div className="marks-tools">
                  <div className="marks-block">
                    <h3>Highlight</h3>
                    <div className="swatch-row">
                      {HIGHLIGHT_COLORS.map((color) => (
                        <button
                          key={color}
                          type="button"
                          className={`swatch swatch--${color} ${mark?.highlight === color ? "is-active" : ""}`}
                          aria-label={`Highlight ${color}`}
                          onClick={() => applyHighlight(color)}
                        />
                      ))}
                      <button
                        type="button"
                        className="ghost-btn"
                        onClick={() => applyHighlight(null)}
                      >
                        Clear
                      </button>
                    </div>
                  </div>

                  <div className="marks-block">
                    <h3>Bookmark</h3>
                    <button
                      type="button"
                      className="primary-btn"
                      onClick={applyBookmark}
                    >
                      {mark?.bookmarked ? "Remove bookmark" : "Bookmark verse"}
                    </button>
                  </div>

                  <div className="marks-block">
                    <h3>Share</h3>
                    <button
                      type="button"
                      className="ghost-btn"
                      onClick={copyCitation}
                    >
                      Copy citation
                    </button>
                  </div>
                </div>
              )}
            </div>
          </>
        ) : (
          <p className="muted">Select a verse in the text to open study tools.</p>
        )}
      </div>
    </aside>
  );
}

function WordsTab({
  loading,
  error,
  data,
}: {
  loading: boolean;
  error?: string;
  data?: VerseWords;
}) {
  if (loading) return <p className="muted">Loading transliteration…</p>;
  if (error) return <p className="muted">{error}</p>;
  if (!data) return null;

  return (
    <>
      <p className="muted source-line">
        {data.lang === "hebrew" ? "Hebrew" : "Greek"} · Latin-script reading
      </p>
      <ol className="word-list">
        {data.tokens.map((token) => (
          <li key={`${token.i}-${token.strongs}-${token.tlit}`}>
            <div className="word-token">
              <span className="word-token__tlit">{token.tlit}</span>
              {token.strongs ? (
                <span className="word-token__strongs">{token.strongs}</span>
              ) : null}
            </div>
            {token.gloss ? (
              <p className="word-token__gloss">{token.gloss}</p>
            ) : null}
            {token.surface ? (
              <p
                className="word-token__surface"
                lang={data.lang === "hebrew" ? "he" : "el"}
              >
                {token.surface}
              </p>
            ) : null}
          </li>
        ))}
      </ol>
      <p className="muted tiny words-attr">{data.attribution}</p>
    </>
  );
}
