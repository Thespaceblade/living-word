"use client";

import { useEffect, useState } from "react";
import type { CommentaryEntry, IntelPayload, VerseRef } from "@/lib/types";

type Props = {
  version: string;
  selected: VerseRef | null;
  onClose: () => void;
};

function EntryBlock({ entry }: { entry: CommentaryEntry }) {
  const isIntro = entry.verseRange === "intro";
  const label = isIntro
    ? entry.chapter === 0
      ? "Book introduction"
      : `Chapter ${entry.chapter} overview`
    : `On vv. ${entry.verseRange}`;

  return (
    <article className="intel-entry">
      <header className="intel-entry__head">
        <span className="intel-entry__label">{label}</span>
        <span className="intel-entry__meta">
          {entry.author}
          {entry.wordCount ? ` · ${entry.wordCount.toLocaleString()} words` : ""}
        </span>
      </header>
      <p className="intel-entry__body">{entry.text}</p>
      {entry.crossReferences.length > 0 ? (
        <div className="intel-xrefs">
          <span className="intel-xrefs__title">Cross-refs</span>
          <ul>
            {entry.crossReferences.slice(0, 16).map((ref) => (
              <li key={ref}>{ref}</li>
            ))}
          </ul>
        </div>
      ) : null}
    </article>
  );
}

export function IntelPanel({ version, selected, onClose }: Props) {
  const [data, setData] = useState<IntelPayload | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(Boolean(selected));

  useEffect(() => {
    if (!selected) return;

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
        if (!res.ok) throw new Error("Failed to load commentary");
        return (await res.json()) as IntelPayload;
      })
      .then((json) => {
        setData(json);
        setLoading(false);
      })
      .catch((err: Error) => {
        if (err.name === "AbortError") return;
        setError("Could not load commentary for this verse.");
        setLoading(false);
      });

    return () => controller.abort();
  }, [selected, version]);

  const open = Boolean(selected);

  return (
    <aside
      className={`intel-panel ${open ? "intel-panel--open" : ""}`}
      aria-hidden={!open}
    >
      <div className="intel-panel__inner">
        <header className="intel-panel__header">
          <div>
            <p className="eyebrow">Commentary</p>
            <h2>
              {selected
                ? `${selected.book} ${selected.chapter}:${selected.verse}`
                : "Select a verse"}
            </h2>
          </div>
          <button type="button" className="ghost-btn" onClick={onClose}>
            Close
          </button>
        </header>

        {loading ? <p className="muted">Loading tagged commentary…</p> : null}
        {error ? <p className="error">{error}</p> : null}

        {data ? (
          <div className="intel-panel__body">
            <blockquote className="verse-quote">“{data.verseText}”</blockquote>
            <p className="muted source-line">
              Source · {data.meta.title} ({data.meta.license})
            </p>

            {data.entries.length === 0 ? (
              <p className="muted">No commentary tagged to this verse yet.</p>
            ) : (
              data.entries.map((entry) => (
                <EntryBlock key={entry.id} entry={entry} />
              ))
            )}
          </div>
        ) : null}
      </div>
    </aside>
  );
}
