import type { BibleVerse } from "@/lib/types";

export const AUDIO_RATES = [0.75, 1, 1.25, 1.5] as const;
export type AudioRate = (typeof AUDIO_RATES)[number];

const SPEED_KEY = "lw-audio-rate";

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

export function speechSupported() {
  return typeof window !== "undefined" && "speechSynthesis" in window;
}

function pickVoice(): SpeechSynthesisVoice | null {
  const voices = window.speechSynthesis.getVoices();
  if (!voices.length) return null;
  return (
    voices.find(
      (v) =>
        /en(-|_)US/i.test(v.lang) &&
        /natural|enhanced|premium/i.test(v.name),
    ) ??
    voices.find((v) => /en(-|_)GB/i.test(v.lang)) ??
    voices.find((v) => /^en/i.test(v.lang)) ??
    voices[0] ??
    null
  );
}

/** Rough fallback duration when speech ends without events. */
export function estimateVerseMs(text: string, rate: number) {
  const words = text.trim().split(/\s+/).filter(Boolean).length;
  const base = Math.max(1600, words * 380);
  return Math.round(base / Math.max(rate, 0.5));
}

export type SpeakHandlers = {
  onStart?: () => void;
  onEnd?: () => void;
};

export function speakVerse(
  text: string,
  rate: number,
  handlers: SpeakHandlers = {},
): { cancel: () => void } {
  let settled = false;
  let timer: ReturnType<typeof setTimeout> | null = null;

  const clearTimer = () => {
    if (timer) {
      clearTimeout(timer);
      timer = null;
    }
  };

  const settle = () => {
    if (settled) return;
    settled = true;
    clearTimer();
    handlers.onEnd?.();
  };

  const cancel = () => {
    settled = true;
    clearTimer();
    if (speechSupported()) window.speechSynthesis.cancel();
  };

  const armFallback = (ms: number) => {
    clearTimer();
    timer = setTimeout(settle, ms);
  };

  handlers.onStart?.();

  if (!speechSupported()) {
    armFallback(estimateVerseMs(text, rate));
    return { cancel };
  }

  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.rate = rate;
  utterance.pitch = 1;
  utterance.lang = "en-US";
  const voice = pickVoice();
  if (voice) utterance.voice = voice;

  utterance.onend = () => settle();
  utterance.onerror = () => armFallback(estimateVerseMs(text, rate));

  try {
    window.speechSynthesis.speak(utterance);
    if (window.speechSynthesis.paused) window.speechSynthesis.resume();
    // Long safety if onend never fires.
    armFallback(Math.max(estimateVerseMs(text, rate) * 3, 45_000));
  } catch {
    armFallback(estimateVerseMs(text, rate));
  }

  return { cancel };
}

export function verseIndex(verses: BibleVerse[], verseNum: number | null) {
  if (verseNum == null) return 0;
  const idx = verses.findIndex((v) => v.verse === verseNum);
  return idx >= 0 ? idx : 0;
}
