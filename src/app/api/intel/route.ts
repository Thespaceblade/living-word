import { NextResponse } from "next/server";
import { getIntel, isValidVersion } from "@/lib/content";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const version = searchParams.get("version") ?? "kjv";
  const slug = searchParams.get("slug");
  const book = searchParams.get("book");
  const chapter = Number(searchParams.get("chapter"));
  const verse = Number(searchParams.get("verse"));

  if (
    !isValidVersion(version) ||
    !slug ||
    !book ||
    !Number.isFinite(chapter) ||
    !Number.isFinite(verse)
  ) {
    return NextResponse.json(
      { error: "Required: version, slug, book, chapter, verse" },
      { status: 400 },
    );
  }

  const intel = getIntel({ book, slug, chapter, verse }, version);
  if (!intel) {
    return NextResponse.json({ error: "Verse not found" }, { status: 404 });
  }

  return NextResponse.json(intel);
}
