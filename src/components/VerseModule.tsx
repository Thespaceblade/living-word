"use client";

import Link from "next/link";
import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
} from "react";
import {
  HIGHLIGHT_COLORS,
  setHighlight,
  setNote,
  toggleBookmark,
  type HighlightColor,
  type VerseMark,
} from "@/lib/marks";
import type {
  CommentaryEntry,
  IntelPayload,
  VerseRef,
  VerseWords,
} from "@/lib/types";
import type { XrefItem } from "@/lib/xrefs";

export type StudyMode =
  | "study"
  | "words"
  | "compare"
  | "xrefs"
  | "notes"
  | null;

type CompareRow = {
  id: string;
  label: string;
  name: string;
  text: string | null;
};

const MODES: { id: NonNullable<StudyMode>; label: string }[] = [
  { id: "study", label: "Commentary" },
  { id: "words", label: "Words" },
  { id: "compare", label: "Compare" },
  { id: "xrefs", label: "Cross-refs" },
  { id: "notes", label: "Note" },
];

const MODULE_WIDTH = 320;
const LERP = 0.14;
const TOP_SAFE = 72;
const BOTTOM_SAFE = 24;
const GAP = 18;

function entryLabel(entry: CommentaryEntry) {
  const isIntro = entry.verseRange === "intro";
  if (isIntro) {
    return entry.chapter === 0
      ? "Book introduction"
      : `Chapter ${entry.chapter} overview`;
  }
  return `On vv. ${entry.verseRange}`;
}

function shortLiteral(gloss: string) {
  const clean = gloss
    .replace(/[<>[\]]/g, "")
    .replace(/\s+/g, " ")
    .trim();
  if (!clean) return "";
  const first = clean.split(/[;|/»]/)[0]?.trim() ?? clean;
  if (first.length <= 18) return first.toLowerCase();
  return `${first.slice(0, 16).replace(/\s+\S*$/, "").toLowerCase()}…`;
}

type Props = {
  version: string;
  selected: VerseRef;
  verseText: string | null;
  mark: VerseMark | null;
  onClose: () => void;
  onXrefNavigate?: () => void;
};

export function VerseModule({
  version,
  selected,
  verseText,
  mark,
  onClose,
  onXrefNavigate,
}: Props) {
  const rootRef = useRef<HTMLDivElement>(null);
  const pos = useRef({ x: 0, y: 0, ready: false });
  const target = useRef({ x: 0, y: 0 });
  const [mode, setMode] = useState<StudyMode>(null);
  const [highlightOpen, setHighlightOpen] = useState(false);
  const [noteDraft, setNoteDraft] = useState(mark?.note ?? "");
  const [placed, setPlaced] = useState(false);

  const intelKey = `${version}:${selected.slug}:${selected.chapter}:${selected.verse}`;
  const compareKey =
    mode === "compare"
      ? `${selected.slug}:${selected.chapter}:${selected.verse}`
      : null;
  const wordsKey =
    mode === "words"
      ? `${selected.slug}:${selected.chapter}:${selected.verse}`
      : null;
  const xrefsKey =
    mode === "xrefs"
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

  useEffect(() => {
    setNoteDraft(mark?.note ?? "");
  }, [mark?.note, selected.slug, selected.chapter, selected.verse]);

  useEffect(() => {
    // Reset expanded mode when the verse changes so the stack relocates cleanly
    setMode(null);
    setHighlightOpen(false);
  }, [selected.slug, selected.chapter, selected.verse]);

  function computeTarget() {
    const verseEl = document.getElementById(`verse-${selected.verse}`);
    const stageEl = document.querySelector(".reader__stage");
    if (!verseEl) return null;

    const verseRect = verseEl.getBoundingClientRect();
    const stageRect = stageEl?.getBoundingClientRect();
    const moduleH = rootRef.current?.offsetHeight ?? 180;
    const moduleW =
      window.innerWidth <= 900
        ? Math.min(MODULE_WIDTH, window.innerWidth - 24)
        : MODULE_WIDTH;

    if (window.innerWidth <= 900) {
      // Bottom-anchored module on small screens
      return {
        x: 12,
        y: Math.max(
          TOP_SAFE,
          window.innerHeight - moduleH - 16,
        ),
      };
    }

    const preferredX = Math.min(
      window.innerWidth - moduleW - 16,
      Math.max(16, (stageRect?.right ?? verseRect.right) + GAP),
    );

    let preferredY = verseRect.top;
    preferredY = Math.max(
      TOP_SAFE,
      Math.min(preferredY, window.innerHeight - moduleH - BOTTOM_SAFE),
    );

    return { x: preferredX, y: preferredY };
  }

  useLayoutEffect(() => {
    const next = computeTarget();
    if (!next) return;
    target.current = next;
    if (!pos.current.ready) {
      pos.current = { ...next, ready: true };
      if (rootRef.current) {
        rootRef.current.style.transform = `translate3d(${next.x}px, ${next.y}px, 0)`;
      }
      setPlaced(true);
    }
  }, [selected.verse, selected.slug, selected.chapter, mode]);

  useEffect(() => {
    let raf = 0;
    const tick = () => {
      const next = computeTarget();
      if (next) target.current = next;

      pos.current.x += (target.current.x - pos.current.x) * LERP;
      pos.current.y += (target.current.y - pos.current.y) * LERP;

      if (rootRef.current) {
        rootRef.current.style.transform = `translate3d(${pos.current.x}px, ${pos.current.y}px, 0)`;
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    function onScrollOrResize() {
      const next = computeTarget();
      if (next) target.current = next;
    }

    window.addEventListener("scroll", onScrollOrResize, { passive: true });
    window.addEventListener("resize", onScrollOrResize);
    const reader = document.querySelector(".reader");
    reader?.addEventListener("scroll", onScrollOrResize, { passive: true });

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("scroll", onScrollOrResize);
      window.removeEventListener("resize", onScrollOrResize);
      reader?.removeEventListener("scroll", onScrollOrResize);
    };
  }, [selected.verse, selected.slug, selected.chapter, mode]);

  // When content expands past the bottom, scroll so the stack sits near the top
  useEffect(() => {
    if (!mode) return;
    const id = window.setTimeout(() => {
      const mod = rootRef.current;
      if (!mod) return;
      const rect = mod.getBoundingClientRect();
      if (rect.bottom <= window.innerHeight - BOTTOM_SAFE) return;

      const verseEl = document.getElementById(`verse-${selected.verse}`);
      verseEl?.scrollIntoView({ behavior: "smooth", block: "start" });
      // After scroll, nudge target toward top-safe so the module settles high
      window.setTimeout(() => {
        const next = computeTarget();
        if (next) {
          target.current = { x: next.x, y: TOP_SAFE + 8 };
        }
      }, 280);
    }, 60);
    return () => window.clearTimeout(id);
  }, [mode, intelResult, wordsResult, compareResult, xrefsResult, selected.verse]);

  useEffect(() => {
    if (mode !== "study") return;
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
      .then((data) => setIntelResult({ key: intelKey, data }))
      .catch((err: Error) => {
        if (err.name === "AbortError") return;
        setIntelResult({
          key: intelKey,
          error: "Could not load commentary for this verse.",
        });
      });
    return () => controller.abort();
  }, [mode, version, selected, intelKey]);

  useEffect(() => {
    if (!compareKey) return;
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
      .then((json) => setCompareResult({ key: compareKey, rows: json.parallels }))
      .catch((err: Error) => {
        if (err.name === "AbortError") return;
        setCompareResult({
          key: compareKey,
          rows: [],
          error: "Could not load parallel translations.",
        });
      });
    return () => controller.abort();
  }, [compareKey, selected]);

  useEffect(() => {
    if (!wordsKey) return;
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
      .then((data) => setWordsResult({ key: wordsKey, data }))
      .catch((err: Error) => {
        if (err.name === "AbortError") return;
        setWordsResult({
          key: wordsKey,
          error: "No transliteration for this verse yet.",
        });
      });
    return () => controller.abort();
  }, [wordsKey, selected]);

  useEffect(() => {
    if (!xrefsKey) return;
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
      .then((json) => setXrefsResult({ key: xrefsKey, items: json.items }))
      .catch((err: Error) => {
        if (err.name === "AbortError") return;
        setXrefsResult({
          key: xrefsKey,
          items: [],
          error: "Could not load cross-references.",
        });
      });
    return () => controller.abort();
  }, [xrefsKey, version, selected]);

  const intel =
    intelResult && intelResult.key === intelKey ? intelResult : null;
  const compare =
    compareResult && compareResult.key === compareKey ? compareResult : null;
  const words =
    wordsResult && wordsResult.key === wordsKey ? wordsResult : null;
  const xrefs =
    xrefsResult && xrefsResult.key === xrefsKey ? xrefsResult : null;

  const markInput = {
    slug: selected.slug,
    book: selected.book,
    chapter: selected.chapter,
    verse: selected.verse,
  };

  function toggleMode(next: NonNullable<StudyMode>) {
    setHighlightOpen(false);
    setMode((current) => (current === next ? null : next));
  }

  function applyHighlight(color: HighlightColor) {
    setHighlight(markInput, color);
    setHighlightOpen(false);
  }

  function copyCitation() {
    if (!verseText) return;
    const citation = `${selected.book} ${selected.chapter}:${selected.verse} ${version.toUpperCase()}\n${verseText}`;
    void navigator.clipboard.writeText(citation);
  }

  const style: CSSProperties = {
    width: MODULE_WIDTH,
    opacity: placed ? 1 : 0,
  };

  return (
    <div
      ref={rootRef}
      className={`verse-module ${mode ? "is-expanded" : ""} ${highlightOpen ? "is-highlighting" : ""}`}
      style={style}
      role="dialog"
      aria-label={`Verse ${selected.book} ${selected.chapter}:${selected.verse}`}
    >
      <div className="verse-module__shell">
        <header className="verse-module__head">
          <p className="verse-module__cite">
            {selected.book} {selected.chapter}:{selected.verse}
          </p>
          <div className="verse-module__tools">
            <button
              type="button"
              className={`verse-module__tool ${highlightOpen ? "is-active" : ""} ${mark?.highlight ? `has-mark is-${mark.highlight}` : ""}`}
              aria-label="Highlight"
              aria-expanded={highlightOpen}
              title="Highlight"
              onClick={() => {
                setMode(null);
                setHighlightOpen((open) => !open);
              }}
            >
              <svg
                className="verse-module__icon"
                viewBox="0 0 16 16"
                aria-hidden
              >
                <path
                  d="M2.2 13.2 4.6 9.4l5.2-5.2 2 2-5.2 5.2-3.8 1.8Zm7.1-9.3 1.6-1.6a1.2 1.2 0 0 1 1.7 0l1.1 1.1a1.2 1.2 0 0 1 0 1.7L12 7.1"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.35"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
            <button
              type="button"
              className={`verse-module__tool ${mark?.bookmarked ? "is-active is-bookmarked" : ""}`}
              aria-label={mark?.bookmarked ? "Remove bookmark" : "Bookmark"}
              title="Bookmark"
              onClick={() => toggleBookmark(markInput)}
            >
              <svg
                className="verse-module__icon"
                viewBox="0 0 16 16"
                aria-hidden
              >
                <path
                  d="M4 2.4h8a.8.8 0 0 1 .8.8v10.1l-4.8-2.6-4.8 2.6V3.2a.8.8 0 0 1 .8-.8Z"
                  fill={mark?.bookmarked ? "currentColor" : "none"}
                  stroke="currentColor"
                  strokeWidth="1.35"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
            <button
              type="button"
              className="verse-module__tool"
              aria-label="Copy verse"
              title="Copy"
              onClick={copyCitation}
            >
              <svg
                className="verse-module__icon"
                viewBox="0 0 16 16"
                aria-hidden
              >
                <rect
                  x="5.2"
                  y="5.2"
                  width="7.2"
                  height="8.2"
                  rx="1.2"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.35"
                />
                <path
                  d="M10.2 5.1V3.8A1.2 1.2 0 0 0 9 2.6H3.8A1.2 1.2 0 0 0 2.6 3.8V11a1.2 1.2 0 0 0 1.2 1.2h1.3"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.35"
                  strokeLinecap="round"
                />
              </svg>
            </button>
            <button
              type="button"
              className="verse-module__close"
              aria-label="Close"
              onClick={onClose}
            >
              ×
            </button>
          </div>
        </header>

        {highlightOpen ? (
          <div className="verse-module__swatches" aria-label="Highlight color">
            {HIGHLIGHT_COLORS.map((color) => (
              <button
                key={color}
                type="button"
                className={`swatch swatch--${color} ${mark?.highlight === color ? "is-active" : ""}`}
                aria-label={`Highlight ${color}`}
                onClick={() => applyHighlight(color)}
              />
            ))}
            {mark?.highlight ? (
              <button
                type="button"
                className="verse-module__clear-hl"
                onClick={() => {
                  setHighlight(markInput, null);
                  setHighlightOpen(false);
                }}
              >
                Clear
              </button>
            ) : null}
          </div>
        ) : null}

        <div className="verse-module__actions" role="toolbar" aria-label="Study">
          {MODES.map((item) => (
            <button
              key={item.id}
              type="button"
              className={`verse-module__action ${mode === item.id ? "is-active" : ""}`}
              aria-pressed={mode === item.id}
              onClick={() => toggleMode(item.id)}
            >
              {item.id === "xrefs" ? "Refs" : item.label}
            </button>
          ))}
        </div>

        {mode ? (
          <div className="verse-module__body" key={`${mode}-${intelKey}`}>
            {mode === "study" && (
              <>
                {!intel && <p className="muted">Gathering commentary…</p>}
                {intel?.error && <p className="error">{intel.error}</p>}
                {intel?.data?.bookIntro ? (
                  <article className="intel-entry intel-entry--intro">
                    <header className="intel-entry__head">
                      <span className="intel-entry__label">
                        {entryLabel(intel.data.bookIntro)}
                      </span>
                    </header>
                    <p className="intel-entry__body">
                      {intel.data.bookIntro.text}
                    </p>
                  </article>
                ) : null}
                {intel?.data &&
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

            {mode === "words" && (
              <WordsBody
                loading={!words}
                error={words?.error}
                data={words?.data}
              />
            )}

            {mode === "compare" && (
              <>
                {!compare && <p className="muted">Loading parallels…</p>}
                {compare?.error && <p className="error">{compare.error}</p>}
                {compare?.rows && compare.rows.length === 0 && (
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

            {mode === "xrefs" && (
              <>
                {!xrefs && <p className="muted">Loading references…</p>}
                {xrefs?.error && <p className="error">{xrefs.error}</p>}
                {xrefs && (xrefs.items?.length ?? 0) === 0 && !xrefs.error && (
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

            {mode === "notes" && (
              <div className="notes-editor">
                <label htmlFor="verse-module-note">Personal note</label>
                <textarea
                  id="verse-module-note"
                  value={noteDraft}
                  onChange={(event) => setNoteDraft(event.target.value)}
                  placeholder="Write a short reflection anchored to this verse…"
                  rows={6}
                />
                <div className="notes-actions">
                  <button
                    type="button"
                    className="primary-btn"
                    onClick={() => setNote(markInput, noteDraft)}
                  >
                    Save note
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : null}
      </div>
    </div>
  );
}

function WordsBody({
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

  const selectedToken =
    active != null ? data.tokens.find((t) => t.i === active) : null;

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
      {selectedToken ? (
        <div className="word-detail">
          <p className="word-detail__tlit">{selectedToken.tlit}</p>
          <p className="word-detail__meta">
            {[selectedToken.strongs, selectedToken.gloss]
              .filter(Boolean)
              .join(" · ")}
          </p>
          {selectedToken.surface ? (
            <p
              className="word-detail__surface"
              lang={data.lang === "hebrew" ? "he" : "el"}
            >
              {selectedToken.surface}
            </p>
          ) : null}
        </div>
      ) : null}
    </>
  );
}
