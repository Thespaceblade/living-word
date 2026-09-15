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
import { commentaryExcerpt } from "@/lib/commentary-excerpt";
import { pickPlainSense, type PlainSenseSource } from "@/lib/plain-sense";

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

const MODES: {
  id: NonNullable<StudyMode>;
  label: string;
}[] = [
  { id: "study", label: "Explainer" },
  { id: "words", label: "Words" },
  { id: "compare", label: "Compare" },
  { id: "xrefs", label: "Refs" },
  { id: "notes", label: "Note" },
];

const MODULE_WIDTH = 320;

function ModeIcon({ id }: { id: NonNullable<StudyMode> }) {
  const common = {
    className: "verse-module__icon",
    viewBox: "0 0 16 16",
    "aria-hidden": true as const,
  };
  switch (id) {
    case "study":
      return (
        <svg {...common}>
          <path
            d="M2.5 3.2h5.2c.9 0 1.6.4 2.3 1 .7-.6 1.4-1 2.3-1H15v9.2h-2.7c-.9 0-1.6.3-2.3.8-.7-.5-1.4-.8-2.3-.8H2.5V3.2Z"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.35"
            strokeLinejoin="round"
          />
          <path
            d="M8 4.4v7.8"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.35"
            strokeLinecap="round"
          />
        </svg>
      );
    case "words":
      return (
        <svg {...common}>
          <path
            d="M2.8 12.2 5.8 3.8h1.6l3 8.4H8.9l-.65-1.85H4.9L4.25 12.2H2.8Zm2.5-3.3h2.5L6.6 5.6 5.3 8.9Z"
            fill="currentColor"
          />
          <path
            d="M10.6 12.2 12.2 7.4h1.35L15.2 12.2h-1.4l-.28-.95h-1.7l-.28.95H10.6Zm2.1-2.3.55-1.85.55 1.85h-1.1Z"
            fill="currentColor"
          />
        </svg>
      );
    case "compare":
      return (
        <svg {...common}>
          <rect
            x="2.4"
            y="3"
            width="4.6"
            height="10"
            rx="1"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.35"
          />
          <rect
            x="9"
            y="3"
            width="4.6"
            height="10"
            rx="1"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.35"
          />
        </svg>
      );
    case "xrefs":
      return (
        <svg {...common}>
          <path
            d="M6.4 9.6a3 3 0 0 1 0-4.2l1.5-1.5a3 3 0 0 1 4.2 4.2L11 9.2"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.35"
            strokeLinecap="round"
          />
          <path
            d="M9.6 6.4a3 3 0 0 1 0 4.2L8.1 12a3 3 0 1 1-4.2-4.2L5 6.8"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.35"
            strokeLinecap="round"
          />
        </svg>
      );
    case "notes":
      return (
        <svg {...common}>
          <path
            d="M3.2 2.8h7.1L12.8 5.3v7.9a1 1 0 0 1-1 1H3.2a1 1 0 0 1-1-1V3.8a1 1 0 0 1 1-1Z"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.35"
            strokeLinejoin="round"
          />
          <path
            d="M10.1 2.9v2.6h2.5M5 8h5.2M5 10.4h3.8"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.35"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      );
    default:
      return null;
  }
}
const LERP = 0.14;
const TOP_SAFE = 72;
const BOTTOM_SAFE = 24;
const GAP = 18;

function entryLabel(entry: CommentaryEntry, verse: number) {
  const isIntro = entry.verseRange === "intro";
  if (isIntro) {
    return entry.chapter === 0
      ? "Book introduction"
      : `Chapter ${entry.chapter} overview`;
  }
  if (entry.verses.length === 1) return `Verse ${entry.verses[0]}`;
  if (entry.verses.includes(verse)) {
    return `Verse ${verse} · from ${entry.verseRange}`;
  }
  return `Verses ${entry.verseRange}`;
}

function ClassicNote({
  entry,
  verse,
}: {
  entry: CommentaryEntry;
  verse: number;
}) {
  const [expanded, setExpanded] = useState(false);
  const { preview, needsExpand } = commentaryExcerpt(entry.text);
  const body = expanded || !needsExpand ? entry.text : preview;

  return (
    <article className="intel-entry intel-entry--classic">
      <header className="intel-entry__head">
        <span className="intel-entry__label">{entryLabel(entry, verse)}</span>
        <span className="intel-entry__meta">{entry.author}</span>
      </header>
      <p className="intel-entry__body">{body}</p>
      {needsExpand ? (
        <button
          type="button"
          className="intel-entry__more"
          aria-expanded={expanded}
          onClick={() => setExpanded((value) => !value)}
        >
          {expanded ? "Show less" : "Read full note"}
        </button>
      ) : null}
    </article>
  );
}

function PlainSenseExplainer({
  plain,
  classic,
  verse,
  loadingPlain,
  loadingClassic,
  plainError,
  classicError,
}: {
  plain: PlainSenseSource | null;
  classic: CommentaryEntry[];
  verse: number;
  loadingPlain: boolean;
  loadingClassic: boolean;
  plainError?: string;
  classicError?: string;
}) {
  const [showClassic, setShowClassic] = useState(false);

  return (
    <div className="plain-sense">
      {loadingPlain ? <p className="muted">Gathering plain sense…</p> : null}
      {plainError ? <p className="error">{plainError}</p> : null}
      {!loadingPlain && !plainError && !plain ? (
        <p className="muted">No plain English reading for this verse yet.</p>
      ) : null}
      {plain ? (
        <article className="intel-entry intel-entry--explainer">
          <header className="intel-entry__head">
            <span className="intel-entry__label">This verse means</span>
            <span className="intel-entry__meta">
              Plain English · {plain.label}
            </span>
          </header>
          <p className="intel-entry__body plain-sense__text">{plain.text}</p>
        </article>
      ) : null}

      {classicError ? <p className="error">{classicError}</p> : null}
      {!loadingClassic && classic.length > 0 ? (
        <div className="plain-sense__classic">
          <button
            type="button"
            className="intel-entry__more"
            aria-expanded={showClassic}
            onClick={() => setShowClassic((value) => !value)}
          >
            {showClassic ? "Hide classic note" : "Classic note"}
          </button>
          {showClassic
            ? classic.map((entry) => (
                <ClassicNote key={entry.id} entry={entry} verse={verse} />
              ))
            : null}
        </div>
      ) : null}
      {loadingClassic && !plain ? (
        <p className="muted">Checking classic notes…</p>
      ) : null}
    </div>
  );
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
  const plainKey =
    mode === "study"
      ? `${selected.slug}:${selected.chapter}:${selected.verse}`
      : null;
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
  const [plainResult, setPlainResult] = useState<{
    key: string;
    plain?: PlainSenseSource | null;
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
  }, [mode, intelResult, plainResult, wordsResult, compareResult, xrefsResult, selected.verse]);

  useEffect(() => {
    if (!plainKey) return;
    const controller = new AbortController();
    const params = new URLSearchParams({
      slug: selected.slug,
      chapter: String(selected.chapter),
      verse: String(selected.verse),
    });
    fetch(`/api/compare?${params}`, { signal: controller.signal })
      .then(async (res) => {
        if (!res.ok) throw new Error("Failed to load plain sense");
        return (await res.json()) as { parallels: CompareRow[] };
      })
      .then((json) => {
        setPlainResult({
          key: plainKey,
          plain: pickPlainSense(json.parallels, version),
        });
      })
      .catch((err: Error) => {
        if (err.name === "AbortError") return;
        setPlainResult({
          key: plainKey,
          plain: null,
          error: "Could not load a plain English reading.",
        });
      });
    return () => controller.abort();
  }, [plainKey, selected, version]);

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
          error: "Could not load classic notes for this verse.",
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
  const plain =
    plainResult && plainKey && plainResult.key === plainKey
      ? plainResult
      : null;
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
              aria-label={item.label}
              aria-pressed={mode === item.id}
              data-label={item.label}
              onClick={() => toggleMode(item.id)}
            >
              <ModeIcon id={item.id} />
            </button>
          ))}
        </div>

        {mode ? (
          <div className="verse-module__body" key={`${mode}-${intelKey}`}>
            {mode === "study" && (
              <PlainSenseExplainer
                plain={plain?.plain ?? null}
                classic={intel?.data?.entries ?? []}
                verse={selected.verse}
                loadingPlain={!plain}
                loadingClassic={!intel}
                plainError={plain?.error}
                classicError={intel?.error}
              />
            )}

            {mode === "words" && (
              <WordsBody
                loading={!words}
                error={words?.error}
                data={words?.data}
                version={version}
                selected={selected}
                onNavigate={onXrefNavigate}
                onClose={onClose}
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

type LexiconPayload = {
  strongs: string;
  entry: {
    id: string;
    lemma: string;
    translit: string;
    pronunciation: string;
    derivation: string;
    strongsDef: string;
    kjvDef: string;
    lang: "hebrew" | "greek";
  } | null;
  occurrences: {
    book: string;
    slug: string;
    chapter: number;
    verse: number;
    text: string;
    gloss: string;
    tlit: string;
  }[];
  total: number;
};

function WordsBody({
  loading,
  error,
  data,
  version,
  selected,
  onNavigate,
  onClose,
}: {
  loading: boolean;
  error?: string;
  data?: VerseWords;
  version: string;
  selected: VerseRef;
  onNavigate?: () => void;
  onClose: () => void;
}) {
  const [active, setActive] = useState<number | null>(null);
  const [lexicon, setLexicon] = useState<{
    key: string;
    data?: LexiconPayload;
    error?: string;
  } | null>(null);

  const selectedToken =
    active != null ? data?.tokens.find((t) => t.i === active) : null;

  useEffect(() => {
    setActive(null);
    setLexicon(null);
  }, [data?.slug, data?.chapter, data?.verse]);

  useEffect(() => {
    if (!selectedToken?.strongs) {
      setLexicon(null);
      return;
    }
    const key = `${version}:${selectedToken.strongs}:${selected.slug}:${selected.chapter}:${selected.verse}`;
    const controller = new AbortController();
    setLexicon({ key });
    const params = new URLSearchParams({
      strongs: selectedToken.strongs,
      version,
      exclude: `${selected.slug}:${selected.chapter}:${selected.verse}`,
      limit: "20",
    });
    fetch(`/api/lexicon?${params}`, { signal: controller.signal })
      .then(async (res) => {
        if (!res.ok) throw new Error("Lexicon unavailable");
        return (await res.json()) as LexiconPayload;
      })
      .then((payload) => setLexicon({ key, data: payload }))
      .catch((err: unknown) => {
        if (controller.signal.aborted) return;
        setLexicon({
          key,
          error: err instanceof Error ? err.message : "Lexicon unavailable",
        });
      });
    return () => controller.abort();
  }, [
    selectedToken?.strongs,
    selectedToken?.i,
    version,
    selected.slug,
    selected.chapter,
    selected.verse,
  ]);

  if (loading) return <p className="muted">Loading transliteration…</p>;
  if (error) return <p className="muted">{error}</p>;
  if (!data) return null;

  const lex =
    lexicon && selectedToken && lexicon.key.includes(selectedToken.strongs)
      ? lexicon
      : null;

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

          {!selectedToken.strongs ? (
            <p className="muted tiny">No Strongs number for this token.</p>
          ) : null}

          {lex && !lex.data && !lex.error ? (
            <p className="muted tiny">Loading Strongs entry…</p>
          ) : null}
          {lex?.error ? <p className="error tiny">{lex.error}</p> : null}

          {lex?.data?.entry ? (
            <div className="lexicon-card">
              <p className="lexicon-card__lemma" lang={lex.data.entry.lang === "hebrew" ? "he" : "el"}>
                {lex.data.entry.lemma}
              </p>
              <p className="lexicon-card__id">{lex.data.entry.id}</p>
              {lex.data.entry.translit ? (
                <p className="lexicon-card__line">
                  <span>Transliteration</span>
                  {lex.data.entry.translit}
                  {lex.data.entry.pronunciation
                    ? ` (${lex.data.entry.pronunciation})`
                    : ""}
                </p>
              ) : null}
              {lex.data.entry.strongsDef ? (
                <p className="lexicon-card__def">{lex.data.entry.strongsDef}</p>
              ) : null}
              {lex.data.entry.kjvDef ? (
                <p className="lexicon-card__line">
                  <span>KJV uses</span>
                  {lex.data.entry.kjvDef}
                </p>
              ) : null}
              {lex.data.entry.derivation ? (
                <p className="lexicon-card__line">
                  <span>Derivation</span>
                  {lex.data.entry.derivation}
                </p>
              ) : null}
            </div>
          ) : null}

          {lex?.data ? (
            <div className="concordance">
              <p className="concordance__heading">
                In this library
                {lex.data.total > 0 ? ` · ${lex.data.total}` : ""}
              </p>
              {lex.data.occurrences.length === 0 ? (
                <p className="muted tiny">No other occurrences yet.</p>
              ) : (
                <ul className="concordance__list">
                  {lex.data.occurrences.map((hit) => (
                    <li key={`${hit.slug}-${hit.chapter}-${hit.verse}`}>
                      <Link
                        className="concordance__item"
                        href={`/read/${version}/${hit.slug}/${hit.chapter}?verse=${hit.verse}`}
                        onClick={() => {
                          onNavigate?.();
                          onClose();
                        }}
                      >
                        <span className="concordance__ref">
                          {hit.book} {hit.chapter}:{hit.verse}
                        </span>
                        <span className="concordance__text">
                          {hit.text || "Open verse"}
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
              {lex.data.total > lex.data.occurrences.length ? (
                <p className="muted tiny">
                  Showing {lex.data.occurrences.length} of {lex.data.total}
                </p>
              ) : null}
            </div>
          ) : null}
        </div>
      ) : (
        <p className="muted tiny">Tap a word for Strongs and concordance.</p>
      )}
    </>
  );
}
