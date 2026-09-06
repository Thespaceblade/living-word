import { notFound } from "next/navigation";
import { BibleReader } from "@/components/BibleReader";
import { getCatalog, getChapter, isValidVersion } from "@/lib/content";

type Props = {
  params: Promise<{ version: string; slug: string; chapter: string }>;
  searchParams: Promise<{ verse?: string }>;
};

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

export default async function ReadPage({ params, searchParams }: Props) {
  const { version, slug, chapter: chapterParam } = await params;
  const { verse: verseParam } = await searchParams;

  if (!isValidVersion(version)) notFound();

  const chapterNum = Number.parseInt(chapterParam, 10);
  if (!Number.isFinite(chapterNum)) notFound();

  const chapter = getChapter(version, slug, chapterNum);
  const catalog = getCatalog();
  if (!chapter) notFound();

  const initialVerse = verseParam ? Number.parseInt(verseParam, 10) : null;

  return (
    <BibleReader
      version={version}
      versions={catalog.versions}
      book={chapter.book}
      slug={chapter.slug}
      chapter={chapter.chapter.chapter}
      verses={chapter.chapter.verses}
      chapterCount={
        catalog.books.find((b) => b.slug === slug)?.chapters ??
        chapter.chapter.chapter
      }
      books={catalog.books.map((b) => ({
        book: b.book,
        slug: b.slug,
        chapters: b.chapters,
      }))}
      initialVerse={
        Number.isFinite(initialVerse as number) ? initialVerse : null
      }
    />
  );
}
