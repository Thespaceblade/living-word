import { notFound } from "next/navigation";
import { BibleReader } from "@/components/BibleReader";
import { getCatalog, getChapter } from "@/lib/content";

type Props = {
  params: Promise<{ slug: string; chapter: string }>;
};

export function generateStaticParams() {
  const catalog = getCatalog();
  return catalog.books.flatMap((book) =>
    Array.from({ length: book.chapters }, (_, i) => ({
      slug: book.slug,
      chapter: String(i + 1),
    })),
  );
}

export default async function ReadPage({ params }: Props) {
  const { slug, chapter: chapterParam } = await params;
  const chapterNum = Number.parseInt(chapterParam, 10);
  if (!Number.isFinite(chapterNum)) notFound();

  const chapter = getChapter(slug, chapterNum);
  const catalog = getCatalog();
  if (!chapter) notFound();

  return (
    <BibleReader
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
    />
  );
}
