"use client";

import { useEffect, useRef, useState } from "react";
import type { SearchHit, SearchResponse, TopicItem } from "@/lib/search-shared";
import { SEARCH_TOPICS } from "@/lib/search-shared";

type Props = {
  version: string;
  onClose: () => void;
  onSelect: (hit: SearchHit) => void;
  initialQuery?: string;
};

export function SearchPanel({
  version,
  onClose,
  onSelect,
  initialQuery = "",
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState(initialQuery);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<SearchResponse | null>(null);
  const topics: TopicItem[] = SEARCH_TOPICS;

  useEffect(() => {
    inputRef.current?.focus();
    inputRef.current?.select();
  }, []);

  useEffect(() => {
    const q = query.trim();
    if (!q) {
      setData(null);
      setError(null);
      setLoading(false);
      return;
    }

    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      setLoading(true);
      setError(null);
      try {
        const params = new URLSearchParams({
          q,
          version,
          limit: "40",
        });
        const res = await fetch(`/api/search?${params}`, {
          signal: controller.signal,
        });
        if (!res.ok) {
          const body = (await res.json().catch(() => null)) as {
            error?: string;
          } | null;
          throw new Error(body?.error ?? "Search failed");
        }
        const json = (await res.json()) as SearchResponse;
        setData(json);
      } catch (err) {
        if ((err as Error).name === "AbortError") return;
        setError((err as Error).message);
        setData(null);
      } finally {
        setLoading(false);
      }
    }, 220);

    return () => {
      controller.abort();
      window.clearTimeout(timer);
    };
  }, [query, version]);

  function runTopic(topic: TopicItem) {
    setQuery(topic.query);
  }

  const modeLabel =
    data?.mode === "strongs"
      ? "Strong’s"
      : data?.mode === "topic"
        ? "Topic"
        : "Text";

  return (
    <div className="reader-search" role="dialog" aria-label="Search Scripture">
      <div className="reader-search__head">
        <label className="reader-search__field">
          <span className="sr-only">Search</span>
          <input
            ref={inputRef}
            type="search"
            value={query}
            placeholder="Search text, topic, or Strong’s (G25)"
            onChange={(event) => setQuery(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Escape") onClose();
            }}
          />
        </label>
        <button
          type="button"
          className="reader-search__close"
          aria-label="Close search"
          onClick={onClose}
        >
          ×
        </button>
      </div>

      {!query.trim() ? (
        <div className="reader-search__topics" aria-label="Topics">
          <p className="reader-search__hint">Try a topic</p>
          <div className="reader-search__chips">
            {topics.map((topic) => (
              <button
                key={topic.id}
                type="button"
                className="reader-search__chip"
                onClick={() => runTopic(topic)}
              >
                {topic.label}
              </button>
            ))}
          </div>
          <p className="reader-search__hint reader-search__hint--soft">
            Or type a phrase, or a Strong’s number like G25 / H7225
          </p>
        </div>
      ) : null}

      {query.trim() ? (
        <div className="reader-search__body">
          {loading && !data ? <p className="muted">Searching…</p> : null}
          {error ? <p className="error">{error}</p> : null}
          {data && data.results.length === 0 && !loading ? (
            <p className="muted">No matches in this library.</p>
          ) : null}
          {data && data.results.length > 0 ? (
            <>
              <p className="reader-search__meta">
                {data.total.toLocaleString()} {modeLabel.toLowerCase()} match
                {data.total === 1 ? "" : "es"}
                {data.total > data.results.length
                  ? ` · showing ${data.results.length}`
                  : ""}
              </p>
              <ul className="reader-search__list">
                {data.results.map((hit) => (
                  <li key={`${hit.slug}-${hit.chapter}-${hit.verse}-${hit.strongs ?? "t"}`}>
                    <button
                      type="button"
                      className="reader-search__hit"
                      onClick={() => onSelect(hit)}
                    >
                      <span className="reader-search__ref">
                        {hit.book} {hit.chapter}:{hit.verse}
                        {hit.strongs ? (
                          <span className="reader-search__tag">
                            {hit.strongs}
                            {hit.tlit ? ` · ${hit.tlit}` : ""}
                          </span>
                        ) : null}
                      </span>
                      <span className="reader-search__snippet">{hit.text}</span>
                    </button>
                  </li>
                ))}
              </ul>
            </>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
