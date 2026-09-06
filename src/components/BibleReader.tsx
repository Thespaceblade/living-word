"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import type { BibleVerse, VerseRef } from "@/lib/types";
import { IntelPanel } from "./IntelPanel";

type Props = {
  book: string;
  slug: string;
  chapter: number;
  verses: BibleVerse[];
  chapterCount: number;
  books: { book: string; slug: string; chapters: number }[];
};

export function BibleReader({
  book,
  slug,
  chapter,
  verses,
  chapterCount,
  books,
}: Props) {
  const router = useRouter();
  const [selected, setSelected] = useState<VerseRef | null>(null);

  const chapters = useMemo(
    () => Array.from({ length: chapterCount }, (_, i) => i + 1),
    [chapterCount],
  );

  return (
    <div className={`shell ${selected ? "shell--intel" : ""}`}>
      <header className="topbar">
        <div className="brand-lockup">
          <p className="brand">Living Word</p>
          <p className="brand-sub">Scripture intel · KJV</p>
        </div>
        <nav className="nav-controls" aria-label="Passage navigation">
          <label className="field">
            <span>Book</span>
            <select
              value={slug}
              onChange={(e) => {
                router.push(`/read/${e.target.value}/1`);
              }}
            >
              {books.map((b) => (
                <option key={b.slug} value={b.slug}>
                  {b.book}
                </option>
              ))}
            </select>
          </label>
          <label className="field">
            <span>Chapter</span>
            <select
              value={chapter}
              onChange={(e) => {
                router.push(`/read/${slug}/${e.target.value}`);
              }}
            >
              {chapters.map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
          </label>
        </nav>
      </header>

      <main className="reader">
        <div className="reader__stage">
          <div className="reader__heading">
            <h1>
              {book} {chapter}
            </h1>
            <p className="muted">
              Click any verse to open tagged commentary and cross-references.
            </p>
          </div>

          <div className="verse-stream">
            {verses.map((v) => {
              const active =
                selected?.chapter === chapter &&
                selected?.verse === v.verse &&
                selected?.slug === slug;
              return (
                <button
                  key={v.verse}
                  type="button"
                  className={`verse ${active ? "verse--active" : ""}`}
                  onClick={() =>
                    setSelected({
                      book,
                      slug,
                      chapter,
                      verse: v.verse,
                    })
                  }
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
              ? `${selected.slug}-${selected.chapter}-${selected.verse}`
              : "closed"
          }
          selected={selected}
          onClose={() => setSelected(null)}
        />
      </main>
    </div>
  );
}
