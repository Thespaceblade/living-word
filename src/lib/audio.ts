import type { BibleVerse } from "@/lib/types";

export const AUDIO_RATES = [0.75, 1, 1.25, 1.5] as const;
export type AudioRate = (typeof AUDIO_RATES)[number];

const SPEED_KEY = "lw-audio-rate";

/** Protestant canon book numbers used by AudioTreasure / archive.org packs. */
const BOOK_NUM: Record<string, string> = {
  genesis: "01",
  psalms: "19",
  john: "43",
};

const BOOK_FILE: Record<string, string> = {
  genesis: "Genesis",
  psalms: "Psalms",
  john: "John",
};

export type AudioSource = {
  url: string;
  label: string;
  /** Which on-screen version the narration matches most closely. */
  narrationVersion: "kjv" | "web";
};

/**
 * Public-domain chapter audio hosted on Internet Archive (CORS-friendly).
 * - KJV: AudioTreasure “Ultra Light” pack
 * - WEB: legacy-web-audio mirror of the David Williams WEB narration
 * - ASV: no dedicated PD pack yet; uses the KJV narration
 */
export function resolveChapterAudio(
  version: string,
  slug: string,
  chapter: number,
): AudioSource | null {
  const num = BOOK_NUM[slug];
  const book = BOOK_FILE[slug];
  if (!num || !book) return null;

  const ch = String(chapter).padStart(3, "0");

  if (version === "web") {
    return {
      url: `https://archive.org/download/legacy-web-audio/out/web-audio/${num}/${ch}.mp3`,
      label: "WEB · public domain",
      narrationVersion: "web",
    };
  }

  // kjv and asv
  return {
    url: `https://archive.org/download/kingjamesversionaudio/${num}_${book}_${ch}.mp3`,
    label: "KJV · public domain",
    narrationVersion: "kjv",
  };
}

export function getSavedAudioRate(): AudioRate {
  if (typeof window === "undefined") return 1;
  const raw = window.localStorage.getItem(SPEED_KEY);
  const value = Number(raw);
  return (AUDIO_RATES as readonly number[]).includes(value)
    ? (value as AudioRate)
    : 1;
}

export function saveAudioRate(rate: AudioRate) {
  window.localStorage.setItem(SPEED_KEY, String(rate));
}

export function verseIndex(verses: BibleVerse[], verseNum: number | null) {
  if (verseNum == null) return 0;
  const idx = verses.findIndex((v) => v.verse === verseNum);
  return idx >= 0 ? idx : 0;
}

function verseWeight(text: string) {
  return Math.max(1, text.trim().split(/\s+/).filter(Boolean).length);
}

/**
 * Approximate verse start times from relative word counts.
 * Real chapter MP3s rarely ship verse timings; this keeps listen-along usable.
 */
export function verseStartTimes(
  verses: BibleVerse[],
  durationSec: number,
): number[] {
  if (!verses.length || !Number.isFinite(durationSec) || durationSec <= 0) {
    return verses.map(() => 0);
  }

  // Leave a little room for chapter titles / breath at the edges.
  const lead = Math.min(1.2, durationSec * 0.02);
  const trail = Math.min(0.8, durationSec * 0.015);
  const usable = Math.max(durationSec - lead - trail, durationSec * 0.9);
  const weights = verses.map((v) => verseWeight(v.text));
  const total = weights.reduce((sum, w) => sum + w, 0) || 1;

  let cursor = 0;
  return weights.map((w) => {
    const start = lead + (cursor / total) * usable;
    cursor += w;
    return start;
  });
}

export function verseAtTime(
  starts: number[],
  verses: BibleVerse[],
  timeSec: number,
): number | null {
  if (!starts.length || !verses.length) return null;
  let idx = 0;
  for (let i = 0; i < starts.length; i += 1) {
    if (timeSec + 0.05 >= starts[i]!) idx = i;
    else break;
  }
  return verses[idx]?.verse ?? null;
}
