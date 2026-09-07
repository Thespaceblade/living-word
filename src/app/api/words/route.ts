import { NextResponse } from "next/server";
import { getVerseWords } from "@/lib/words";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const slug = searchParams.get("slug");
  const chapter = Number(searchParams.get("chapter"));
  const verse = Number(searchParams.get("verse"));

  if (!slug || !Number.isFinite(chapter) || !Number.isFinite(verse)) {
    return NextResponse.json(
      { error: "Required: slug, chapter, verse" },
      { status: 400 },
    );
  }

  const data = getVerseWords(slug, chapter, verse);
  if (!data) {
    return NextResponse.json(
      { error: "No word study for this verse yet" },
      { status: 404 },
    );
  }

  return NextResponse.json(data);
}
