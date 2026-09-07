import { NextResponse } from "next/server";
import { getCatalog, getChapter } from "@/lib/content";

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

  const catalog = getCatalog();
  const parallels = catalog.versions.map((version) => {
    const ch = getChapter(version.id, slug, chapter);
    const text =
      ch?.chapter.verses.find((v) => v.verse === verse)?.text ?? null;
    return {
      id: version.id,
      label: version.label,
      name: version.name,
      text,
    };
  });

  if (parallels.every((p) => !p.text)) {
    return NextResponse.json({ error: "Verse not found" }, { status: 404 });
  }

  return NextResponse.json({
    slug,
    chapter,
    verse,
    parallels,
  });
}
