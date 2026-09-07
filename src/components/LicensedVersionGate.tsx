"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { LivingWordLogo } from "@/components/LivingWordLogo";
import type { BibleVersion } from "@/lib/types";

type Props = {
  version: string;
  book: string;
  slug: string;
  chapter: number;
  versions: BibleVersion[];
  books: { book: string; slug: string; chapters: number }[];
  reason: "needs_key" | "error";
  message?: string;
};

export function LicensedVersionGate({
  version,
  book,
  slug,
  chapter,
  versions,
  books,
  reason,
  message,
}: Props) {
  const router = useRouter();
  const meta =
    versions.find((v) => v.id === version) ??
    ({
      id: version,
      label: version.toUpperCase(),
      name: version,
    } satisfies BibleVersion);
  const localFallback = versions.find((v) => v.source !== "licensed")?.id ?? "kjv";

  return (
    <div className="shell shell--biblecom">
      <header className="reader-bar">
        <div className="reader-bar__inner">
          <Link href="/" className="reader-bar__brand" aria-label="Living Word home">
            <LivingWordLogo size="sm" />
          </Link>
          <div className="reader-bar__pills">
            <span className="reader-bar__pill is-open">
              <span>
                {book} {chapter}
              </span>
            </span>
            <label className="reader-bar__pill is-open">
              <span className="sr-only">Version</span>
              <select
                value={version}
                aria-label="Version"
                onChange={(e) => {
                  router.push(`/read/${e.target.value}/${slug}/${chapter}`);
                }}
              >
                {versions.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.label}: {v.name}
                    {v.source === "licensed" && v.ready === false ? " (setup)" : ""}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </div>
      </header>

      <main className="reader">
        <div className="reader__stage">
          <div className="license-gate">
            <h1>{meta.label}</h1>
            <p className="reader__meta">{meta.name}</p>
            {reason === "needs_key" ? (
              <>
                <p>
                  {meta.label} is a licensed translation. Living Word loads it
                  through an official Bible API when you add keys locally. The
                  copyrighted text is never bundled in this repository.
                </p>
                <ol className="license-gate__steps">
                  {version === "esv" ? (
                    <li>
                      Create an app key at{" "}
                      <a href="https://api.esv.org/" target="_blank" rel="noreferrer">
                        api.esv.org
                      </a>{" "}
                      and set <code>ESV_API_KEY</code>.
                    </li>
                  ) : (
                    <li>
                      Create an API.Bible key at{" "}
                      <a
                        href="https://scripture.api.bible/"
                        target="_blank"
                        rel="noreferrer"
                      >
                        scripture.api.bible
                      </a>
                      , enable NIV/NKJV on your plan, and set{" "}
                      <code>API_BIBLE_KEY</code>.
                    </li>
                  )}
                  <li>
                    Optional: set <code>API_BIBLE_NIV_ID</code> /{" "}
                    <code>API_BIBLE_NKJV_ID</code> if your account uses different
                    Bible ids.
                  </li>
                  <li>Restart the app, then reopen this chapter.</li>
                </ol>
              </>
            ) : (
              <p>{message ?? "Could not load this licensed chapter."}</p>
            )}
            <div className="cta-row">
              <Link className="cta" href={`/read/${localFallback}/${slug}/${chapter}`}>
                Read in {localFallback.toUpperCase()}
              </Link>
              <Link className="cta cta--ghost" href="/">
                Home
              </Link>
            </div>
            <p className="license-gate__books">
              Available books:{" "}
              {books.map((b) => b.book).join(", ")}.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
