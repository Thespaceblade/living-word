import { NextResponse } from "next/server";
import { isValidVersion } from "@/lib/content";
import { getLexiconPayload } from "@/lib/lexicon";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const strongs = searchParams.get("strongs");
  const version = searchParams.get("version") ?? "kjv";
  const exclude = searchParams.get("exclude") ?? undefined;
  const limit = Number(searchParams.get("limit") ?? "24");

  if (!strongs) {
    return NextResponse.json({ error: "Required: strongs" }, { status: 400 });
  }
  if (!isValidVersion(version)) {
    return NextResponse.json({ error: "Invalid version" }, { status: 400 });
  }

  const payload = getLexiconPayload(strongs, {
    version,
    exclude,
    limit: Number.isFinite(limit) ? limit : 24,
  });
  if (!payload) {
    return NextResponse.json({ error: "Unknown Strongs number" }, { status: 404 });
  }

  return NextResponse.json(payload);
}
