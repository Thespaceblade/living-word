"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState, useSyncExternalStore } from "react";
import type {
  BibleVerse,
  BibleVersion,
  LayoutMode,
  VerseRef,
} from "@/lib/types";
import { IntelPanel } from "./IntelPanel";

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

const LAYOUT_KEY = "lw-layout";
const layoutListeners = new Set<() => void>();

function getLayoutSnapshot(): LayoutMode {
  const saved = window.localStorage.getItem(LAYOUT_KEY);
  return saved === "dual" ? "dual" : "single";
}

function getServerLayoutSnapshot(): LayoutMode {
  return "single";
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
  const layout = useSyncExternalStore(
    subscribeLayout,
    getLayoutSnapshot,
    getServerLayoutSnapshot,
  );
  const [focusVerse, setFocusVerse] = useState<number | null>(initialVerse);
  const [selected, setSelected] = useState<VerseRef | null>(() =>
    initialVerse
      ? { book, slug, chapter, verse: initialVerse }
      : null,
  );

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

  useEffect(() => {
    if (!focusVerse) return;
    document
      .getElementById(`verse-${focusVerse}`)
      ?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [focusVerse, chapter, slug, version]);

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
    setFocusVerse(verseNum);
    if (verseNum == null) setSelected(null);
    else setSelected({ book, slug, chapter, verse: verseNum });
    goTo({ verse: verseNum, replace: true });
  }

  return (
    <div className={`shell ${selected ? "shell--intel" : ""}`}>
      <header className="topbar">
        <div className="brand-lockup">
          <p className="brand">Living Word</p>
          <p className="brand-sub">Holy Bible · {versionMeta.label}</p>
        </div>

        <nav className="nav-controls" aria-label="Passage navigation">
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
              onChange={(e) =>
                goTo({ slug: e.target.value, chapter: 1, verse: null })
              }
            >
              {books.map((b) => (
                <option key={b.slug} value={b.slug}>
                  {b.book}
                </option>
              ))}
            </select>
          </label>

          <label className="field field--narrow">
            <span>Chapter</span>
            <select
              value={chapter}
              onChange={(e) =>
                goTo({ chapter: Number(e.target.value), verse: null })
              }
            >
              {chapters.map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
          </label>

          <label className="field field--narrow">
            <span>Verse</span>
            <select
              value={focusVerse ?? ""}
              onChange={(e) => {
                const raw = e.target.value;
                if (!raw) {
                  chooseVerse(null);
                  return;
                }
                chooseVerse(Number(raw));
              }}
            >
              <option value="">All</option>
              {verses.map((v) => (
                <option key={v.verse} value={v.verse}>
                  {v.verse}
                </option>
              ))}
            </select>
          </label>

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
        </nav>
      </header>

      <main className="reader">
        <div className={`reader__stage reader__stage--${layout}`}>
          <div className="reader__heading">
            <h1>
              {book} {chapter}
            </h1>
            <p className="muted">
              {versionMeta.name} · tap a verse for commentary
            </p>
          </div>

          <div className={`verse-stream verse-stream--${layout}`}>
            {verses.map((v) => {
              const active =
                selected?.chapter === chapter &&
                selected?.verse === v.verse &&
                selected?.slug === slug;
              return (
                <button
                  key={v.verse}
                  id={`verse-${v.verse}`}
                  type="button"
                  className={`verse ${active ? "verse--active" : ""}`}
                  onClick={() => chooseVerse(v.verse)}
                >
                  <sup className="verse__n">{v.verse}</sup>
                  <span className="verse__t">{v.text}</span>
                </button>
              );
            })}
          </div>
        </div>

        <IntelPanel
          key={
            selected
              ? `${version}-${selected.slug}-${selected.chapter}-${selected.verse}`
              : "closed"
          }
          version={version}
          selected={selected}
          onClose={() => chooseVerse(null)}
        />
      </main>
    </div>
  );
}
