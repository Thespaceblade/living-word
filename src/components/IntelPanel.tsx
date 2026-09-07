"use client";

import Link from "next/link";
import { useEffect, useState, useSyncExternalStore } from "react";
import {
  type VerseMark,
  setNote,
} from "@/lib/marks";
import type {
  CommentaryEntry,
  IntelPayload,
  VerseRef,
  VerseWords,
} from "@/lib/types";
import type { XrefItem } from "@/lib/xrefs";

export type StudyTabId =
  | "study"
  | "words"
  | "compare"
  | "xrefs"
  | "notes";

type CompareRow = {
  id: string;
  label: string;
  name: string;
  text: string | null;
};

const TABS: { id: StudyTabId; label: string }[] = [
  { id: "study", label: "Commentary" },
  { id: "words", label: "Words" },
  { id: "compare", label: "Compare" },
  { id: "xrefs", label: "Cross-refs" },
  { id: "notes", label: "Notes" },
];

const TAB_KEY = "lw-study-tab";
const tabListeners = new Set<() => void>();

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
  // Marks folded into the verse card; map legacy value to commentary
  if (saved === "marks") return "study";
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
  onXrefNavigate?: () => void;
  onClose: () => void;
};

export function IntelPanel({
  version,
  selected,
  verseText,
  mark,
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
  const xrefsKey =
    selected && tab === "xrefs"
      ? `${version}:${selected.slug}:${selected.chapter}:${selected.verse}`
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
  const [xrefsResult, setXrefsResult] = useState<{
    key: string;
    items?: XrefItem[];
    error?: string;
  } | null>(null);

  const [noteDraft, setNoteDraft] = useState(mark?.note ?? "");

  useEffect(() => {
    setNoteDraft(mark?.note ?? "");
  }, [mark?.note, selected?.slug, selected?.chapter, selected?.verse]);

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

  useEffect(() => {
    if (!selected || !xrefsKey) return;

    const controller = new AbortController();
    const params = new URLSearchParams({
      version,
      slug: selected.slug,
      book: selected.book,
      chapter: String(selected.chapter),
      verse: String(selected.verse),
    });

    fetch(`/api/xrefs?${params}`, { signal: controller.signal })
      .then(async (res) => {
        if (!res.ok) throw new Error("Failed to load cross-refs");
        return (await res.json()) as { items: XrefItem[] };
      })
      .then((json) => {
        setXrefsResult({ key: xrefsKey, items: json.items });
      })
      .catch((err: Error) => {
        if (err.name === "AbortError") return;
        setXrefsResult({
          key: xrefsKey,
          items: [],
          error: "Could not load cross-references.",
        });
      });

    return () => controller.abort();
  }, [selected, version, xrefsKey]);

  const intel =
    intelResult && intelResult.key === intelKey ? intelResult : null;
  const compare =
    compareResult && compareResult.key === compareKey ? compareResult : null;
  const words =
    wordsResult && wordsResult.key === wordsKey ? wordsResult : null;
  const xrefs =
    xrefsResult && xrefsResult.key === xrefsKey ? xrefsResult : null;
  const intelLoading = Boolean(intelKey) && !intel;
  const compareLoading = Boolean(compareKey) && !compare;
  const wordsLoading = Boolean(wordsKey) && !words;
  const xrefsLoading = Boolean(xrefsKey) && !xrefs;

  const open = Boolean(selected);
  const markInput = selected
    ? {
        slug: selected.slug,
        book: selected.book,
        chapter: selected.chapter,
        verse: selected.verse,
      }
    : null;

  function saveNote() {
    if (!markInput) return;
    setNote(markInput, noteDraft);
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
                  {intel?.data?.bookIntro ? (
                    <article className="intel-entry intel-entry--intro">
                      <header className="intel-entry__head">
                        <span className="intel-entry__label">
                          {entryLabel(intel.data.bookIntro)}
                        </span>
                        <span className="intel-entry__meta">
                          {intel.data.bookIntro.author}
                        </span>
                      </header>
                      <p className="intel-entry__body">
                        {intel.data.bookIntro.text}
                      </p>
                    </article>
                  ) : null}
                  {!intelLoading &&
                    !intel?.error &&
                    intel?.data &&
                    intel.data.entries.length === 0 &&
                    !intel.data.bookIntro && (
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
                  {xrefsLoading && (
                    <p className="muted">Loading references…</p>
                  )}
                  {xrefs?.error && <p className="error">{xrefs.error}</p>}
                  {!xrefsLoading &&
                    !xrefs?.error &&
                    (xrefs?.items?.length ?? 0) === 0 && (
                      <p className="muted">
                        No verified cross-references in this library yet.
                      </p>
                    )}
                  <ul className="xref-list">
                    {(xrefs?.items ?? []).map((item) => {
                      if (item.jumpable && item.slug && item.text) {
                        return (
                          <li key={item.raw}>
                            <Link
                              className="xref-card"
                              href={`/read/${version}/${item.slug}/${item.chapter}?verse=${item.verse}`}
                              onClick={() => {
                                onXrefNavigate?.();
                                onClose();
                              }}
                            >
                              <span className="xref-card__ref">{item.label}</span>
                              <span className="xref-card__snippet">
                                {item.text}
                              </span>
                            </Link>
                          </li>
                        );
                      }
                      return (
                        <li key={item.raw}>
                          <span className="xref-card xref-card--locked">
                            <span className="xref-card__ref">{item.label}</span>
                            <span className="xref-card__meta">Not in library</span>
                          </span>
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
            </div>
          </>
        ) : (
          <p className="muted">Select a verse in the text to open study tools.</p>
        )}
      </div>
    </aside>
  );
}

function shortLiteral(gloss: string) {
  const clean = gloss
    .replace(/[<>[\]]/g, "")
    .replace(/\s+/g, " ")
    .trim();
  if (!clean) return "";
  // Prefer the first sense before semicolon / slash clutter
  const first = clean.split(/[;|/»]/)[0]?.trim() ?? clean;
  if (first.length <= 18) return first.toLowerCase();
  return `${first.slice(0, 16).replace(/\s+\S*$/, "").toLowerCase()}…`;
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
  const [active, setActive] = useState<number | null>(null);

  if (loading) return <p className="muted">Loading transliteration…</p>;
  if (error) return <p className="muted">{error}</p>;
  if (!data) return null;

  const selected = active != null ? data.tokens.find((t) => t.i === active) : null;

  return (
    <>
      <div className="word-flow" role="list">
        {data.tokens.map((token) => {
          const literal = shortLiteral(token.gloss);
          return (
            <button
              key={`${token.i}-${token.strongs}-${token.tlit}`}
              type="button"
              role="listitem"
              className={`word-chip ${active === token.i ? "is-active" : ""}`}
              title={[token.strongs, token.gloss].filter(Boolean).join(" · ")}
              onClick={() =>
                setActive((prev) => (prev === token.i ? null : token.i))
              }
            >
              <span className="word-chip__tlit">{token.tlit}</span>
              {literal ? (
                <span className="word-chip__literal">({literal})</span>
              ) : null}
            </button>
          );
        })}
      </div>
      {selected ? (
        <div className="word-detail">
          <p className="word-detail__tlit">{selected.tlit}</p>
          <p className="word-detail__meta">
            {[selected.strongs, selected.gloss].filter(Boolean).join(" · ")}
          </p>
          {selected.surface ? (
            <p
              className="word-detail__surface"
              lang={data.lang === "hebrew" ? "he" : "el"}
            >
              {selected.surface}
            </p>
          ) : null}
        </div>
      ) : null}
    </>
  );
}
