import { NextResponse } from "next/server";
import { isValidVersion } from "@/lib/content";
import { resolveXrefs } from "@/lib/xrefs";

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

  const items = resolveXrefs({ book, slug, chapter, verse }, version);
  return NextResponse.json({ items });
}
