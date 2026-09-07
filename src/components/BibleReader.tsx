"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import {
  getMark,
  getMarksSnapshot,
  getServerMarksSnapshot,
  subscribeMarks,
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
import { VerseModule } from "./VerseModule";

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
type FontScale = "sm" | "md" | "lg";

const LAYOUT_KEY = "lw-layout";
const FONT_KEY = "lw-font-scale";
const layoutListeners = new Set<() => void>();
const fontListeners = new Set<() => void>();

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

function getFontSnapshot(): FontScale {
  const saved = window.localStorage.getItem(FONT_KEY);
  return saved === "sm" || saved === "lg" ? saved : "md";
}

function getServerFontSnapshot(): FontScale {
  return "md";
}

function subscribeFont(onStoreChange: () => void) {
  fontListeners.add(onStoreChange);
  return () => fontListeners.delete(onStoreChange);
}

function writeFont(scale: FontScale) {
  window.localStorage.setItem(FONT_KEY, scale);
  fontListeners.forEach((listener) => listener());
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
  const fontScale = useSyncExternalStore(
    subscribeFont,
    getFontSnapshot,
    getServerFontSnapshot,
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
  const [navOpen, setNavOpen] = useState(false);
  const [navLayer, setNavLayer] = useState<NavLayer>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);

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

  const bookIndex = books.findIndex((b) => b.slug === slug);
  const canGoPrev = chapter > 1 || bookIndex > 0;
  const canGoNext =
    chapter < chapterCount || (bookIndex >= 0 && bookIndex < books.length - 1);

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
    const el = document.getElementById(`verse-${focusVerse}`);
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const topSafe = 72;
    const bottomSafe = window.innerHeight - 24;
    const inView = rect.top >= topSafe && rect.bottom <= bottomSafe;
    if (!inView) {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [focusVerse, chapter, slug, version]);

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key !== "Escape") return;
      if (navOpen || settingsOpen) {
        setNavOpen(false);
        setNavLayer(null);
        setSettingsOpen(false);
        return;
      }
      if (selected) {
        setSelected(null);
        setFocusVerse(null);
        router.replace(`/read/${version}/${slug}/${chapter}`);
      }
    }

    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [navOpen, settingsOpen, selected, version, slug, chapter, router]);

  useEffect(() => {
    if (!navOpen && !settingsOpen) return;

    function onPointerDown(event: MouseEvent) {
      if (!navRef.current?.contains(event.target as Node)) {
        setNavOpen(false);
        setNavLayer(null);
        setSettingsOpen(false);
      }
    }

    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, [navOpen, settingsOpen]);

  useEffect(() => {
    if (!selected) return;

    function onPointerDown(event: MouseEvent) {
      const target = event.target as HTMLElement | null;
      if (!target) return;
      if (target.closest(".verse-module")) return;
      if (target.closest(".verse")) return;
      if (target.closest(".reader-bar")) return;
      if (target.closest(".chapter-arrow")) return;
      setSelected(null);
      setFocusVerse(null);
      router.replace(`/read/${version}/${slug}/${chapter}`);
    }

    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, [selected, version, slug, chapter, router]);

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

  function chooseVerse(verseNum: number | null) {
    // Toggle off when clicking the same verse again
    if (
      verseNum != null &&
      selected &&
      selected.slug === slug &&
      selected.chapter === chapter &&
      selected.verse === verseNum
    ) {
      setFocusVerse(null);
      setSelected(null);
      goTo({ verse: null, replace: true });
      return;
    }

    setFocusVerse(verseNum);
    if (verseNum == null) {
      setSelected(null);
    } else {
      setSelected({ book, slug, chapter, verse: verseNum });
      setNavOpen(false);
      setNavLayer(null);
      setSettingsOpen(false);
    }
    goTo({ verse: verseNum, replace: true });
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
    router.push(
      `/read/${place.version}/${place.slug}/${place.chapter}?verse=${place.verse}`,
    );
  }

  function openLayer(layer: NavLayer) {
    setSettingsOpen(false);
    setNavOpen(true);
    setNavLayer(layer);
  }

  function goChapter(delta: -1 | 1) {
    const nextChapter = chapter + delta;
    if (nextChapter >= 1 && nextChapter <= chapterCount) {
      setFocusVerse(null);
      setSelected(null);
      goTo({ chapter: nextChapter, verse: null });
      return;
    }

    if (delta < 0 && bookIndex > 0) {
      const prev = books[bookIndex - 1];
      setFocusVerse(null);
      setSelected(null);
      goTo({ slug: prev.slug, chapter: prev.chapters, verse: null });
      return;
    }

    if (delta > 0 && bookIndex >= 0 && bookIndex < books.length - 1) {
      const next = books[bookIndex + 1];
      setFocusVerse(null);
      setSelected(null);
      goTo({ slug: next.slug, chapter: 1, verse: null });
    }
  }

  return (
    <div className={`shell shell--biblecom shell--font-${fontScale}`}>
      <header className="reader-bar" ref={navRef}>
        <div className="reader-bar__inner">
          <Link href="/" className="reader-bar__brand">
            Living Word
          </Link>

          <div className="reader-bar__pills">
            <button
              type="button"
              className={`reader-bar__pill ${navOpen && (navLayer === "place" || navLayer === "chapter" || navLayer === "verse" || navLayer == null) ? "is-open" : ""}`}
              aria-expanded={navOpen}
              onClick={() => openLayer("chapter")}
            >
              <span>
                {book} {chapter}
              </span>
              <span className="reader-bar__caret" aria-hidden />
            </button>
            <button
              type="button"
              className={`reader-bar__pill ${navOpen && navLayer === "place" ? "is-open" : ""}`}
              aria-expanded={navOpen && navLayer === "place"}
              onClick={() => openLayer("place")}
            >
              <span>{versionMeta.label}</span>
              <span className="reader-bar__caret" aria-hidden />
            </button>
          </div>

          <div className="reader-bar__tools">
            <button
              type="button"
              className={`reader-bar__icon ${layout === "dual" ? "is-active" : ""}`}
              aria-label="Dual-column layout"
              title="Dual columns"
              aria-pressed={layout === "dual"}
              onClick={() =>
                writeLayout(layout === "dual" ? "single" : "dual")
              }
            >
              <span className="reader-bar__parallel" aria-hidden />
            </button>
            <button
              type="button"
              className={`reader-bar__icon ${settingsOpen ? "is-active" : ""}`}
              aria-label="Text settings"
              aria-expanded={settingsOpen}
              onClick={() => {
                setNavOpen(false);
                setNavLayer(null);
                setSettingsOpen((open) => !open);
              }}
            >
              AA
            </button>
          </div>
        </div>

        {navOpen ? (
          <div className="reader-menu">
            <div className="reader-menu__tabs" role="tablist" aria-label="Navigate">
              <button
                type="button"
                role="tab"
                aria-selected={navLayer === "place" || navLayer == null}
                className={navLayer === "place" || navLayer == null ? "is-active" : ""}
                onClick={() => setNavLayer("place")}
              >
                Book
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={navLayer === "chapter"}
                className={navLayer === "chapter" ? "is-active" : ""}
                onClick={() => setNavLayer("chapter")}
              >
                Chapter
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={navLayer === "verse"}
                className={navLayer === "verse" ? "is-active" : ""}
                onClick={() => setNavLayer("verse")}
              >
                Verse
              </button>
            </div>

            {(navLayer === "place" || navLayer == null) && (
              <div className="reader-menu__panel">
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
            )}

            {navLayer === "chapter" && (
              <div className="reader-menu__panel">
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
            )}

            {navLayer === "verse" && (
              <div className="reader-menu__panel">
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
            )}
          </div>
        ) : null}

        {settingsOpen ? (
          <div className="reader-settings" role="dialog" aria-label="Text settings">
            <p className="reader-settings__label">Font size</p>
            <div className="reader-settings__sizes" role="group" aria-label="Font size">
              <button
                type="button"
                className={`reader-settings__size reader-settings__size--sm ${fontScale === "sm" ? "is-active" : ""}`}
                onClick={() => writeFont("sm")}
              >
                AA
              </button>
              <button
                type="button"
                className={`reader-settings__size reader-settings__size--md ${fontScale === "md" ? "is-active" : ""}`}
                onClick={() => writeFont("md")}
              >
                AA
              </button>
              <button
                type="button"
                className={`reader-settings__size reader-settings__size--lg ${fontScale === "lg" ? "is-active" : ""}`}
                onClick={() => writeFont("lg")}
              >
                AA
              </button>
            </div>
          </div>
        ) : null}
      </header>

      <button
        type="button"
        className="chapter-arrow chapter-arrow--prev"
        aria-label="Previous chapter"
        disabled={!canGoPrev}
        onClick={() => goChapter(-1)}
      >
        <span aria-hidden>‹</span>
      </button>
      <button
        type="button"
        className="chapter-arrow chapter-arrow--next"
        aria-label="Next chapter"
        disabled={!canGoNext}
        onClick={() => goChapter(1)}
      >
        <span aria-hidden>›</span>
      </button>

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
            <p className="reader__meta">{versionMeta.name}</p>
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

        {selected && selected.slug === slug && selected.chapter === chapter ? (
          <VerseModule
            version={version}
            versionLabel={versionMeta.label}
            selected={selected}
            verseText={selectedVerseText}
            mark={selectedMark}
            onXrefNavigate={handleXrefNavigate}
            onClose={() => {
              setSelected(null);
              setFocusVerse(null);
              router.replace(`/read/${version}/${slug}/${chapter}`);
            }}
          />
        ) : null}
      </main>
    </div>
  );
}
