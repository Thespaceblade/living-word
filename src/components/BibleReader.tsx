"use client";

import { useRouter } from "next/navigation";
import {
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import {
  HIGHLIGHT_COLORS,
  getMark,
  getMarksSnapshot,
  getServerMarksSnapshot,
  setHighlight,
  subscribeMarks,
  toggleBookmark,
  type HighlightColor,
} from "@/lib/marks";
import {
  clearTrail,
  formatTrailLabel,
  getServerTrailSnapshot,
  getTrailSnapshot,
  popTrail,
  pushTrail,
  subscribeTrail,
} from "@/lib/reading-trail";
import type {
  BibleVerse,
  BibleVersion,
  LayoutMode,
  VerseRef,
} from "@/lib/types";
import { IntelPanel, preferStudyTab, type StudyTabId } from "./IntelPanel";

type Props = {
  version: string;
  versions: BibleVersion[];
  book: string;
  slug: string;
  chapter: number;
  verses: BibleVerse[];
  chapterCount: number;
  books: { book: string; slug: string; chapters: number }[];
  initialVerse?: number | null;
};

type NavLayer = "place" | "chapter" | "verse" | null;

const LAYOUT_KEY = "lw-layout";
const layoutListeners = new Set<() => void>();

function getLayoutSnapshot(): LayoutMode {
  const saved = window.localStorage.getItem(LAYOUT_KEY);
  return saved === "dual" ? "dual" : "single";
}

const SERVER_LAYOUT: LayoutMode = "single";

function getServerLayoutSnapshot(): LayoutMode {
  return SERVER_LAYOUT;
}

function subscribeLayout(onStoreChange: () => void) {
  layoutListeners.add(onStoreChange);
  return () => layoutListeners.delete(onStoreChange);
}

function writeLayout(mode: LayoutMode) {
  window.localStorage.setItem(LAYOUT_KEY, mode);
  layoutListeners.forEach((listener) => listener());
}

export function BibleReader({
  version,
  versions,
  book,
  slug,
  chapter,
  verses,
  chapterCount,
  books,
  initialVerse = null,
}: Props) {
  const router = useRouter();
  const navRef = useRef<HTMLDivElement>(null);
  const layout = useSyncExternalStore(
    subscribeLayout,
    getLayoutSnapshot,
    getServerLayoutSnapshot,
  );
  const marks = useSyncExternalStore(
    subscribeMarks,
    getMarksSnapshot,
    getServerMarksSnapshot,
  );
  const trail = useSyncExternalStore(
    subscribeTrail,
    getTrailSnapshot,
    getServerTrailSnapshot,
  );
  const trailTop = trail[trail.length - 1] ?? null;
  const [focusVerse, setFocusVerse] = useState<number | null>(initialVerse);
  const [selected, setSelected] = useState<VerseRef | null>(() =>
    initialVerse
      ? { book, slug, chapter, verse: initialVerse }
      : null,
  );
  const [panelOpen, setPanelOpen] = useState(Boolean(initialVerse));
  const [toolbarOpen, setToolbarOpen] = useState(false);
  const [navOpen, setNavOpen] = useState(false);
  const [navLayer, setNavLayer] = useState<NavLayer>(null);

  const chapters = useMemo(
    () => Array.from({ length: chapterCount }, (_, i) => i + 1),
    [chapterCount],
  );

  const versionMeta =
    versions.find((v) => v.id === version) ??
    ({
      id: version,
      label: version.toUpperCase(),
      name: version,
    } satisfies BibleVersion);

  const selectedVerseText = useMemo(() => {
    if (!selected || selected.slug !== slug || selected.chapter !== chapter) {
      return null;
    }
    return verses.find((v) => v.verse === selected.verse)?.text ?? null;
  }, [selected, slug, chapter, verses]);

  const selectedMark =
    selected && selected.slug === slug && selected.chapter === chapter
      ? getMark(marks, selected.slug, selected.chapter, selected.verse)
      : selected
        ? getMark(marks, selected.slug, selected.chapter, selected.verse)
        : null;

  useEffect(() => {
    if (!focusVerse) return;
    document
      .getElementById(`verse-${focusVerse}`)
      ?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [focusVerse, chapter, slug, version]);

  useEffect(() => {
    if (!navOpen) return;

    function onPointerDown(event: MouseEvent) {
      if (!navRef.current?.contains(event.target as Node)) {
        setNavOpen(false);
        setNavLayer(null);
      }
    }

    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setNavOpen(false);
        setNavLayer(null);
      }
    }

    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [navOpen]);

  function goTo(next: {
    version?: string;
    slug?: string;
    chapter?: number;
    verse?: number | null;
    replace?: boolean;
  }) {
    const v = next.version ?? version;
    const s = next.slug ?? slug;
    const c = next.chapter ?? chapter;
    const verse = next.verse === undefined ? focusVerse : next.verse;
    const qs = verse ? `?verse=${verse}` : "";
    const href = `/read/${v}/${s}/${c}${qs}`;
    if (next.replace) router.replace(href);
    else router.push(href);
  }

  function chooseVerse(verseNum: number | null, opts?: { openPanel?: boolean }) {
    setFocusVerse(verseNum);
    if (verseNum == null) {
      setSelected(null);
      setPanelOpen(false);
      setToolbarOpen(false);
    } else {
      setSelected({ book, slug, chapter, verse: verseNum });
      setToolbarOpen(true);
      setPanelOpen(opts?.openPanel !== false);
      setNavOpen(false);
      setNavLayer(null);
    }
    goTo({ verse: verseNum, replace: true });
  }

  function openStudy(tab?: StudyTabId) {
    if (!selected) return;
    if (tab) preferStudyTab(tab);
    setPanelOpen(true);
    setToolbarOpen(false);
  }

  function markInputFor(verseNum: number) {
    return { slug, book, chapter, verse: verseNum };
  }

  function copySelected() {
    if (!selected || !selectedVerseText) return;
    const citation = `${selected.book} ${selected.chapter}:${selected.verse} ${version.toUpperCase()}\n${selectedVerseText}`;
    void navigator.clipboard.writeText(citation);
  }

  function quickHighlight(color: HighlightColor) {
    if (!selected) return;
    setHighlight(markInputFor(selected.verse), color);
  }

  function handleXrefNavigate() {
    const from =
      selected ??
      (focusVerse
        ? { book, slug, chapter, verse: focusVerse }
        : null);
    if (!from) return;
    pushTrail({
      version,
      book: from.book,
      slug: from.slug,
      chapter: from.chapter,
      verse: from.verse,
    });
  }

  function goBackOnTrail() {
    const place = popTrail();
    if (!place) return;
    setPanelOpen(true);
    setToolbarOpen(false);
    router.push(
      `/read/${place.version}/${place.slug}/${place.chapter}?verse=${place.verse}`,
    );
  }

  function toggleNav() {
    setNavOpen((open) => {
      if (open) setNavLayer(null);
      return !open;
    });
  }

  function toggleLayer(layer: NavLayer) {
    setNavLayer((current) => (current === layer ? null : layer));
  }

  return (
    <div className={`shell ${panelOpen && selected ? "shell--intel" : ""}`}>
      <div
        className={`nav-dock ${navOpen ? "is-open" : ""}`}
        ref={navRef}
      >
        <button
          type="button"
          className="nav-dock__trigger"
          aria-expanded={navOpen}
          aria-controls="nav-dock-panel"
          onClick={toggleNav}
        >
          <span className="nav-dock__brand">Living Word</span>
          <span className="nav-dock__here">
            {book} {chapter}
            {focusVerse ? `:${focusVerse}` : ""} · {versionMeta.label}
          </span>
          <span className={`nav-dock__chev ${navOpen ? "is-open" : ""}`} aria-hidden>
            <span className="nav-dock__chev-mark" />
          </span>
        </button>

        <div
          id="nav-dock-panel"
          className={`nav-float ${navOpen ? "is-open" : ""}`}
          aria-hidden={!navOpen}
        >
          <div className="nav-float__stack">
            <button
              type="button"
              className={`nav-tile ${navLayer === "place" ? "is-active" : ""}`}
              onClick={() => toggleLayer("place")}
            >
              <span className="nav-tile__label">Place</span>
              <span className="nav-tile__value">
                {versionMeta.label} · {book}
              </span>
            </button>
            <button
              type="button"
              className={`nav-tile ${navLayer === "chapter" ? "is-active" : ""}`}
              onClick={() => toggleLayer("chapter")}
            >
              <span className="nav-tile__label">Chapter</span>
              <span className="nav-tile__value">{chapter}</span>
            </button>
            <button
              type="button"
              className={`nav-tile ${navLayer === "verse" ? "is-active" : ""}`}
              onClick={() => toggleLayer("verse")}
            >
              <span className="nav-tile__label">Verse</span>
              <span className="nav-tile__value">
                {focusVerse ?? "All"}
              </span>
            </button>
          </div>

          <div className="nav-float__footer">
            <div className="layout-toggle" role="group" aria-label="Layout">
              <span>Layout</span>
              <div className="layout-toggle__btns">
                <button
                  type="button"
                  className={layout === "single" ? "is-active" : ""}
                  onClick={() => writeLayout("single")}
                >
                  Single
                </button>
                <button
                  type="button"
                  className={layout === "dual" ? "is-active" : ""}
                  onClick={() => writeLayout("dual")}
                >
                  Dual
                </button>
              </div>
            </div>
            <button
              type="button"
              className="ghost-btn"
              onClick={() => {
                setNavOpen(false);
                setNavLayer(null);
              }}
            >
              Done
            </button>
          </div>
        </div>

        <div
          className={`nav-popout ${navOpen && navLayer === "place" ? "is-open" : ""}`}
          aria-hidden={!(navOpen && navLayer === "place")}
        >
          <p className="nav-popout__title">Version & book</p>
          <label className="field">
            <span>Version</span>
            <select
              value={version}
              onChange={(e) =>
                goTo({ version: e.target.value, verse: focusVerse })
              }
            >
              {versions.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.label} — {v.name}
                </option>
              ))}
            </select>
          </label>
          <label className="field">
            <span>Book</span>
            <select
              value={slug}
              onChange={(e) => {
                goTo({ slug: e.target.value, chapter: 1, verse: null });
                setNavLayer("chapter");
              }}
            >
              {books.map((b) => (
                <option key={b.slug} value={b.slug}>
                  {b.book}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div
          className={`nav-popout ${navOpen && navLayer === "chapter" ? "is-open" : ""}`}
          aria-hidden={!(navOpen && navLayer === "chapter")}
        >
          <p className="nav-popout__title">Chapter</p>
          <div className="picker-grid" role="listbox" aria-label="Chapter">
            {chapters.map((n, i) => (
              <button
                key={n}
                type="button"
                role="option"
                aria-selected={n === chapter}
                className={`picker-grid__item ${n === chapter ? "is-active" : ""}`}
                style={{ ["--i" as string]: i }}
                onClick={() => {
                  goTo({ chapter: n, verse: null });
                  setNavLayer("verse");
                }}
              >
                {n}
              </button>
            ))}
          </div>
        </div>

        <div
          className={`nav-popout ${navOpen && navLayer === "verse" ? "is-open" : ""}`}
          aria-hidden={!(navOpen && navLayer === "verse")}
        >
          <p className="nav-popout__title">Verse</p>
          <div className="picker-grid" role="listbox" aria-label="Verse">
            <button
              type="button"
              role="option"
              aria-selected={focusVerse == null}
              className={`picker-grid__item picker-grid__item--wide ${focusVerse == null ? "is-active" : ""}`}
              style={{ ["--i" as string]: 0 }}
              onClick={() => chooseVerse(null)}
            >
              All
            </button>
            {verses.map((v, i) => {
              const mark = getMark(marks, slug, chapter, v.verse);
              return (
                <button
                  key={v.verse}
                  type="button"
                  role="option"
                  aria-selected={focusVerse === v.verse}
                  className={`picker-grid__item ${focusVerse === v.verse ? "is-active" : ""} ${mark?.bookmarked ? "is-bookmarked" : ""}`}
                  style={{ ["--i" as string]: i + 1 }}
                  onClick={() => chooseVerse(v.verse)}
                >
                  {v.verse}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <main className="reader">
        <div className={`reader__stage reader__stage--${layout}`}>
          <div className="reader__heading">
            {trailTop ? (
              <div className="reading-trail" role="navigation" aria-label="Reading trail">
                <button
                  type="button"
                  className="reading-trail__back"
                  onClick={goBackOnTrail}
                >
                  Back to {formatTrailLabel(trailTop)}
                </button>
                {trail.length > 1 ? (
                  <span className="muted tiny">{trail.length} places</span>
                ) : null}
                <button
                  type="button"
                  className="reading-trail__clear"
                  onClick={() => clearTrail()}
                  aria-label="Clear reading trail"
                >
                  Clear
                </button>
              </div>
            ) : null}
            <h1>
              {book} {chapter}
            </h1>
            <p className="muted">
              {versionMeta.name} · tap a verse to mark or study
            </p>
          </div>

          <div className={`verse-stream verse-stream--${layout}`}>
            {verses.map((v) => {
              const active =
                selected?.chapter === chapter &&
                selected?.verse === v.verse &&
                selected?.slug === slug;
              const mark = getMark(marks, slug, chapter, v.verse);
              const hlClass = mark?.highlight
                ? `verse--hl-${mark.highlight}`
                : "";
              return (
                <button
                  key={v.verse}
                  id={`verse-${v.verse}`}
                  type="button"
                  className={`verse ${active ? "verse--active" : ""} ${hlClass} ${mark?.bookmarked ? "verse--bookmarked" : ""}`}
                  onClick={() => chooseVerse(v.verse)}
                >
                  <sup className="verse__n">
                    {v.verse}
                    {mark?.bookmarked ? (
                      <span className="verse__mark" aria-hidden>
                        ·
                      </span>
                    ) : null}
                  </sup>
                  <span className="verse__t">{v.text}</span>
                </button>
              );
            })}
          </div>
        </div>

        {toolbarOpen && selected && selected.slug === slug ? (
          <div className="verse-toolbar" role="toolbar" aria-label="Verse tools">
            <div className="verse-toolbar__swatches">
              {HIGHLIGHT_COLORS.map((color) => (
                <button
                  key={color}
                  type="button"
                  className={`swatch swatch--${color} ${selectedMark?.highlight === color ? "is-active" : ""}`}
                  aria-label={`Highlight ${color}`}
                  onClick={() => quickHighlight(color)}
                />
              ))}
            </div>
            <button
              type="button"
              className="ghost-btn"
              onClick={() => {
                toggleBookmark(markInputFor(selected.verse));
              }}
            >
              {selectedMark?.bookmarked ? "Unbookmark" : "Bookmark"}
            </button>
            <button
              type="button"
              className="ghost-btn"
              onClick={() => openStudy("notes")}
            >
              Note
            </button>
            <button type="button" className="ghost-btn" onClick={copySelected}>
              Copy
            </button>
            <button
              type="button"
              className="primary-btn"
              onClick={() => openStudy()}
            >
              Study
            </button>
          </div>
        ) : null}

        <IntelPanel
          key={
            selected
              ? `${version}-${selected.slug}-${selected.chapter}-${selected.verse}`
              : "closed"
          }
          version={version}
          selected={panelOpen ? selected : null}
          verseText={selectedVerseText}
          mark={selectedMark}
          onXrefNavigate={handleXrefNavigate}
          onClose={() => {
            setPanelOpen(false);
            setToolbarOpen(Boolean(selected));
          }}
        />
      </main>
    </div>
  );
}
