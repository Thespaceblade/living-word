import { Suspense } from "react";
import { notFound } from "next/navigation";
import { BibleReader } from "@/components/BibleReader";
import { LicensedVersionGate } from "@/components/LicensedVersionGate";
import {
  getCatalog,
  getChapterForRead,
  getVersions,
  isValidVersion,
} from "@/lib/content";
import { isLicensedVersionId } from "@/lib/licensed-versions";

type Props = {
  params: Promise<{ version: string; slug: string; chapter: string }>;
};

export const dynamicParams = false;

export function generateStaticParams() {
  const catalog = getCatalog();
  return catalog.versions.flatMap((version) =>
    catalog.books.flatMap((book) =>
      Array.from({ length: book.chapters }, (_, i) => ({
        version: version.id,
        slug: book.slug,
        chapter: String(i + 1),
      })),
    ),
  );
}

export default async function ReadPage({ params }: Props) {
  const { version, slug, chapter: chapterParam } = await params;

  if (!isValidVersion(version)) notFound();

  const chapterNum = Number.parseInt(chapterParam, 10);
  if (!Number.isFinite(chapterNum)) notFound();

  const catalog = getCatalog();
  const bookMeta = catalog.books.find((b) => b.slug === slug);
  if (!bookMeta) notFound();

  const loaded = await getChapterForRead(version, slug, chapterNum);
  const versions = getVersions();

  if (loaded.status === "needs_key" || loaded.status === "error") {
    return (
      <LicensedVersionGate
        version={version}
        book={bookMeta.book}
        slug={slug}
        chapter={chapterNum}
        versions={versions}
        books={catalog.books.map((b) => ({
          book: b.book,
          slug: b.slug,
          chapters: b.chapters,
        }))}
        reason={loaded.status === "needs_key" ? "needs_key" : "error"}
        message={loaded.status === "error" ? loaded.message : undefined}
      />
    );
  }

  if (loaded.status !== "ok") notFound();

  return (
    <Suspense fallback={<main className="reader-shell" aria-busy="true" />}>
      <BibleReader
        version={version}
        versions={versions}
        book={loaded.book}
        slug={loaded.slug}
        chapter={loaded.chapter.chapter}
        verses={loaded.chapter.verses}
        chapterCount={bookMeta.chapters}
        books={catalog.books.map((b) => ({
          book: b.book,
          slug: b.slug,
          chapters: b.chapters,
        }))}
        copyrightNotice={
          isLicensedVersionId(version) ? loaded.copyright : null
        }
      />
    </Suspense>
  );
}
