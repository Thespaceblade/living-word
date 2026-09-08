import { NextResponse } from "next/server";
import { getChapter, isValidVersion } from "@/lib/content";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const version = searchParams.get("version");
  const slug = searchParams.get("slug");
  const chapter = Number(searchParams.get("chapter"));

  if (
    !version ||
    !slug ||
    !Number.isFinite(chapter) ||
    !isValidVersion(version)
  ) {
    return NextResponse.json(
      { error: "Required: version, slug, chapter" },
      { status: 400 },
    );
  }

  const data = getChapter(version, slug, chapter);
  if (!data) {
    return NextResponse.json({ error: "Chapter not found" }, { status: 404 });
  }

  return NextResponse.json({
    book: data.book,
    slug: data.slug,
    version: data.version,
    chapter: data.chapter.chapter,
    verses: data.chapter.verses,
  });
}
