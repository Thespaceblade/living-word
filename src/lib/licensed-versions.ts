import type { BibleVersion } from "@/lib/types";

export type LicensedVersionId = "esv" | "niv" | "nkjv";

export type LicensedVersionMeta = BibleVersion & {
  id: LicensedVersionId;
  source: "licensed";
  copyright: string;
  provider: "esv" | "api.bible";
};

export const LICENSED_VERSIONS: LicensedVersionMeta[] = [
  {
    id: "esv",
    label: "ESV",
    name: "English Standard Version",
    source: "licensed",
    provider: "esv",
    copyright:
      "Scripture quotations are from the ESV® Bible (The Holy Bible, English Standard Version®), © Crossway, a publishing ministry of Good News Publishers. Used by permission. All rights reserved.",
  },
  {
    id: "niv",
    label: "NIV",
    name: "New International Version",
    source: "licensed",
    provider: "api.bible",
    copyright:
      "Scripture quotations taken from The Holy Bible, New International Version®, NIV®. Copyright © Biblica, Inc.™ Used by permission. All rights reserved worldwide.",
  },
  {
    id: "nkjv",
    label: "NKJV",
    name: "New King James Version",
    source: "licensed",
    provider: "api.bible",
    copyright:
      "Scripture taken from the New King James Version®. Copyright © Thomas Nelson. Used by permission. All rights reserved.",
  },
];

const SLUG_TO_USFM: Record<string, string> = {
  genesis: "GEN",
  psalms: "PSA",
  john: "JHN",
};

const SLUG_TO_ESV_NAME: Record<string, string> = {
  genesis: "Genesis",
  psalms: "Psalm",
  john: "John",
};

export function isLicensedVersionId(id: string): id is LicensedVersionId {
  return id === "esv" || id === "niv" || id === "nkjv";
}

export function getLicensedMeta(id: string): LicensedVersionMeta | null {
  return LICENSED_VERSIONS.find((v) => v.id === id) ?? null;
}

export function usfmChapterId(slug: string, chapter: number): string | null {
  const book = SLUG_TO_USFM[slug];
  if (!book) return null;
  return `${book}.${chapter}`;
}

export function esvPassageQuery(slug: string, chapter: number): string | null {
  const book = SLUG_TO_ESV_NAME[slug];
  if (!book) return null;
  return `${book} ${chapter}`;
}

export function esvApiKey(): string | null {
  const key = process.env.ESV_API_KEY?.trim();
  return key ? key : null;
}

export function apiBibleKey(): string | null {
  const key =
    process.env.API_BIBLE_KEY?.trim() ||
    process.env.SCRIPTURE_API_KEY?.trim() ||
    null;
  return key ? key : null;
}

/** Override via env after you list bibles on your API.Bible account. */
export function apiBibleIdFor(version: LicensedVersionId): string | null {
  if (version === "niv") {
    return process.env.API_BIBLE_NIV_ID?.trim() || "78a9f6124f344018-01";
  }
  if (version === "nkjv") {
    return process.env.API_BIBLE_NKJV_ID?.trim() || "de4e12af7f28f599-02";
  }
  return null;
}

export function isLicensedVersionConfigured(id: string): boolean {
  const meta = getLicensedMeta(id);
  if (!meta) return false;
  if (meta.provider === "esv") return Boolean(esvApiKey());
  return Boolean(apiBibleKey());
}

export function licensedVersionsForUi(): Array<
  LicensedVersionMeta & { ready: boolean }
> {
  return LICENSED_VERSIONS.map((v) => ({
    ...v,
    ready: isLicensedVersionConfigured(v.id),
  }));
}
