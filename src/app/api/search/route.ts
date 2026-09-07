import { NextResponse } from "next/server";
import { SEARCH_TOPICS, searchLibrary } from "@/lib/search";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);

  if (searchParams.get("topics") === "1") {
    return NextResponse.json({ topics: SEARCH_TOPICS });
  }

  const q = searchParams.get("q") ?? "";
  const version = searchParams.get("version") ?? undefined;
  const mode = searchParams.get("mode");
  const limit = Number(searchParams.get("limit") ?? "40");

  if (!q.trim()) {
    return NextResponse.json(
      { error: "Required: q" },
      { status: 400 },
    );
  }

  const data = searchLibrary({
    query: q,
    version,
    mode,
    limit: Number.isFinite(limit) ? limit : 40,
  });

  return NextResponse.json(data);
}
