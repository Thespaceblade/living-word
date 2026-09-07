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
import { LivingWordLogo } from "@/components/LivingWordLogo";
import { PlanReadingBar } from "@/components/PlanReadingBar";
import { SearchPanel } from "@/components/SearchPanel";
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
import type { SearchHit } from "@/lib/search-shared";
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
  planId?: string | null;
  planDay?: number | null;
};

type NavLayer = "place" | "chapter" | "verse" | null;
type FontScale = "sm" | "md" | "lg";

const LAYOUT_KEY = "lw-layout";
const FONT_KEY = "lw-font-scale";
const PARALLEL_KEY = "lw-parallel-version";
const layoutListeners = new Set<() => void>();
const fontListeners = new Set<() => void>();
const parallelListeners = new Set<() => void>();

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

function readParallelPreference(): string | null {
  return window.localStorage.getItem(PARALLEL_KEY);
}

function writeParallelVersion(id: string) {
  window.localStorage.setItem(PARALLEL_KEY, id);
  parallelListeners.forEach((listener) => listener());
}

function subscribeParallel(onStoreChange: () => void) {
  parallelListeners.add(onStoreChange);
  return () => parallelListeners.delete(onStoreChange);
}

function pickDefaultParallel(primary: string, versions: BibleVersion[]) {
  const preferred = ["web", "bsb", "nheb", "bbe", "asv", "kjv"];
  for (const id of preferred) {
    if (id !== primary && versions.some((v) => v.id === id)) return id;
  }
  return versions.find((v) => v.id !== primary)?.id ?? primary;
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
  planId = null,
  planDay = null,
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
  const parallelPref = useSyncExternalStore(
    subscribeParallel,
    readParallelPreference,
    () => null,
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
  const [searchOpen, setSearchOpen] = useState(false);
  const [parallelVerses, setParallelVerses] = useState<BibleVerse[] | null>(
    null,
  );
  const [parallelError, setParallelError] = useState<string | null>(null);

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

  const parallelVersion = useMemo(() => {
    if (
      parallelPref &&
      parallelPref !== version &&
      versions.some((v) => v.id === parallelPref)
    ) {
      return parallelPref;
    }
    return pickDefaultParallel(version, versions);
  }, [parallelPref, version, versions]);

  const parallelMeta =
    versions.find((v) => v.id === parallelVersion) ??
    ({
      id: parallelVersion,
      label: parallelVersion.toUpperCase(),
      name: parallelVersion,
    } satisfies BibleVersion);

  useEffect(() => {
    if (layout !== "dual") {
      setParallelVerses(null);
      setParallelError(null);
      return;
    }
    if (parallelVersion === version) {
      setParallelVerses(verses);
      setParallelError(null);
      return;
    }

    const controller = new AbortController();
    setParallelVerses(null);
    setParallelError(null);
    const params = new URLSearchParams({
      version: parallelVersion,
      slug,
      chapter: String(chapter),
    });
    fetch(`/api/chapter?${params}`, { signal: controller.signal })
      .then(async (res) => {
        if (!res.ok) throw new Error("Could not load parallel chapter");
        return (await res.json()) as { verses: BibleVerse[] };
      })
      .then((json) => {
        setParallelVerses(json.verses);
      })
      .catch((error: unknown) => {
        if (controller.signal.aborted) return;
        setParallelError(
          error instanceof Error ? error.message : "Parallel load failed",
        );
      });
    return () => controller.abort();
  }, [layout, parallelVersion, version, slug, chapter, verses]);

  const parallelByVerse = useMemo(() => {
    const map = new Map<number, string>();
    for (const v of parallelVerses ?? []) map.set(v.verse, v.text);
    return map;
  }, [parallelVerses]);

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
      if (navOpen || settingsOpen || searchOpen) {
        setNavOpen(false);
        setNavLayer(null);
        setSettingsOpen(false);
        setSearchOpen(false);
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
  }, [navOpen, settingsOpen, searchOpen, selected, version, slug, chapter, router]);

  useEffect(() => {
    if (!navOpen && !settingsOpen && !searchOpen) return;

    function onPointerDown(event: MouseEvent) {
      if (!navRef.current?.contains(event.target as Node)) {
        setNavOpen(false);
        setNavLayer(null);
        setSettingsOpen(false);
        setSearchOpen(false);
      }
    }

    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, [navOpen, settingsOpen, searchOpen]);

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
      setSearchOpen(false);
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
    setSearchOpen(false);
    setNavOpen(true);
    setNavLayer(layer);
  }

  function openSearch() {
    setNavOpen(false);
    setNavLayer(null);
    setSettingsOpen(false);
    setSearchOpen((open) => !open);
  }

  function selectSearchHit(hit: SearchHit) {
    setSearchOpen(false);
    setFocusVerse(hit.verse);
    setSelected({
      book: hit.book,
      slug: hit.slug,
      chapter: hit.chapter,
      verse: hit.verse,
    });
    goTo({
      slug: hit.slug,
      chapter: hit.chapter,
      verse: hit.verse,
    });
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
          <Link href="/" className="reader-bar__brand" aria-label="Living Word home">
            <LivingWordLogo size="sm" />
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
              className={`reader-bar__icon ${searchOpen ? "is-active" : ""}`}
              aria-label="Search Scripture"
              title="Search"
              aria-expanded={searchOpen}
              onClick={openSearch}
            >
              <svg
                className="reader-bar__search-icon"
                viewBox="0 0 16 16"
                aria-hidden
              >
                <circle
                  cx="7"
                  cy="7"
                  r="4.25"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                />
                <path
                  d="M10.2 10.2 13.4 13.4"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                />
              </svg>
            </button>
            <button
              type="button"
              className={`reader-bar__icon ${layout === "dual" ? "is-active" : ""}`}
              aria-label="Side-by-side versions"
              title="Side-by-side versions"
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
                setSearchOpen(false);
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
                        {v.label}: {v.name}
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
            <label className="field reader-settings__parallel">
              <span>Parallel version</span>
              <select
                value={parallelVersion}
                onChange={(e) => {
                  writeParallelVersion(e.target.value);
                  writeLayout("dual");
                }}
              >
                {versions
                  .filter((v) => v.id !== version)
                  .map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.label}: {v.name}
                    </option>
                  ))}
              </select>
            </label>
          </div>
        ) : null}

        {searchOpen ? (
          <SearchPanel
            version={version}
            onClose={() => setSearchOpen(false)}
            onSelect={selectSearchHit}
          />
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
        {planId && planDay ? (
          <PlanReadingBar
            planId={planId}
            day={planDay}
            version={version}
            slug={slug}
            chapter={chapter}
          />
        ) : null}
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
            <p className="reader__meta">
              {layout === "dual"
                ? `${versionMeta.label} · ${parallelMeta.label}`
                : versionMeta.name}
            </p>
          </div>

          {layout === "dual" ? (
            <div className="parallel-board">
              <div className="parallel-board__heads" aria-hidden>
                <p className="parallel-board__label">{versionMeta.label}</p>
                <p className="parallel-board__label">{parallelMeta.label}</p>
              </div>
              {parallelError ? (
                <p className="parallel-board__status error">{parallelError}</p>
              ) : null}
              {!parallelVerses && !parallelError ? (
                <p className="parallel-board__status muted">Loading parallel…</p>
              ) : null}
              <div className="parallel-board__rows">
                {verses.map((v) => {
                  const active =
                    selected?.chapter === chapter &&
                    selected?.verse === v.verse &&
                    selected?.slug === slug;
                  const mark = getMark(marks, slug, chapter, v.verse);
                  const hlClass = mark?.highlight
                    ? `verse--hl-${mark.highlight}`
                    : "";
                  const parallelText = parallelByVerse.get(v.verse) ?? "";
                  return (
                    <div
                      key={v.verse}
                      id={`verse-${v.verse}`}
                      className={`parallel-row ${active ? "is-active" : ""}`}
                    >
                      <button
                        type="button"
                        className={`verse parallel-row__cell ${active ? "verse--active" : ""} ${hlClass} ${mark?.bookmarked ? "verse--bookmarked" : ""}`}
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
                      <button
                        type="button"
                        className={`verse parallel-row__cell ${active ? "verse--active" : ""}`}
                        onClick={() => chooseVerse(v.verse)}
                      >
                        <sup className="verse__n">{v.verse}</sup>
                        <span className="verse__t">
                          {parallelText || (parallelVerses ? "" : "…")}
                        </span>
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="verse-stream verse-stream--single">
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
          )}
        </div>

        {selected && selected.slug === slug && selected.chapter === chapter ? (
          <VerseModule
            version={version}
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
