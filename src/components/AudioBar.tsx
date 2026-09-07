"use client";

import { useEffect, useRef, useState } from "react";
import type { BibleVerse } from "@/lib/types";
import {
  AUDIO_RATES,
  getSavedAudioRate,
  saveAudioRate,
  speakVerse,
  type AudioRate,
  verseIndex,
} from "@/lib/audio";

type Props = {
  book: string;
  chapter: number;
  verses: BibleVerse[];
  listeningVerse: number | null;
  onListeningVerse: (verse: number | null) => void;
  onRequestChapter: (delta: -1 | 1) => void;
  canPrevChapter: boolean;
  canNextChapter: boolean;
  open: boolean;
  onClose: () => void;
};

export function AudioBar({
  book,
  chapter,
  verses,
  listeningVerse,
  onListeningVerse,
  onRequestChapter,
  canPrevChapter,
  canNextChapter,
  open,
  onClose,
}: Props) {
  const [playing, setPlaying] = useState(false);
  const [rate, setRate] = useState<AudioRate>(1);
  const cancelRef = useRef<(() => void) | null>(null);
  const playingRef = useRef(false);
  const rateRef = useRef(rate);
  const versesRef = useRef(verses);
  const listeningRef = useRef(listeningVerse);

  useEffect(() => {
    setRate(getSavedAudioRate());
  }, []);

  useEffect(() => {
    rateRef.current = rate;
  }, [rate]);

  useEffect(() => {
    versesRef.current = verses;
  }, [verses]);

  useEffect(() => {
    listeningRef.current = listeningVerse;
  }, [listeningVerse]);

  useEffect(() => {
    // Stop when the chapter changes under us.
    cancelRef.current?.();
    cancelRef.current = null;
    playingRef.current = false;
    setPlaying(false);
    onListeningVerse(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [book, chapter]);

  useEffect(() => {
    return () => {
      cancelRef.current?.();
      cancelRef.current = null;
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  function stopPlayback(clearHighlight = true) {
    cancelRef.current?.();
    cancelRef.current = null;
    playingRef.current = false;
    setPlaying(false);
    if (clearHighlight) onListeningVerse(null);
  }

  function speakAt(index: number) {
    const list = versesRef.current;
    const verse = list[index];
    if (!verse) {
      stopPlayback(true);
      return;
    }

    cancelRef.current?.();
    onListeningVerse(verse.verse);
    playingRef.current = true;
    setPlaying(true);

    const handle = speakVerse(verse.text, rateRef.current, {
      onEnd: () => {
        if (!playingRef.current) return;
        const next = index + 1;
        if (next < versesRef.current.length) {
          speakAt(next);
        } else {
          stopPlayback(true);
        }
      },
    });
    cancelRef.current = handle.cancel;
  }

  function togglePlay() {
    if (playingRef.current) {
      stopPlayback(false);
      return;
    }
    const start = verseIndex(verses, listeningVerse ?? verses[0]?.verse ?? null);
    speakAt(start);
  }

  function skipVerse(delta: -1 | 1) {
    const list = verses;
    if (!list.length) return;
    const current = verseIndex(list, listeningVerse ?? list[0]?.verse ?? null);
    const next = Math.min(Math.max(current + delta, 0), list.length - 1);
    if (playingRef.current) {
      speakAt(next);
    } else {
      onListeningVerse(list[next]!.verse);
    }
  }

  function changeRate(next: AudioRate) {
    setRate(next);
    saveAudioRate(next);
    rateRef.current = next;
    if (playingRef.current) {
      const idx = verseIndex(verses, listeningVerse);
      speakAt(idx);
    }
  }

  if (!open) return null;

  const label =
    listeningVerse != null
      ? `${book} ${chapter}:${listeningVerse}`
      : `${book} ${chapter}`;

  return (
    <div className="audio-bar" role="region" aria-label="Audio Bible">
      <div className="audio-bar__copy">
        <p className="audio-bar__label">Listen · {label}</p>
      </div>

      <div className="audio-bar__transport" role="group" aria-label="Playback">
        <button
          type="button"
          className="audio-bar__btn"
          aria-label="Previous chapter"
          disabled={!canPrevChapter}
          onClick={() => {
            stopPlayback(true);
            onRequestChapter(-1);
          }}
        >
          ‹‹
        </button>
        <button
          type="button"
          className="audio-bar__btn"
          aria-label="Previous verse"
          disabled={verses.length === 0}
          onClick={() => skipVerse(-1)}
        >
          ‹
        </button>
        <button
          type="button"
          className={`audio-bar__btn audio-bar__btn--play ${playing ? "is-active" : ""}`}
          aria-label={playing ? "Pause" : "Play"}
          onClick={togglePlay}
        >
          {playing ? "Pause" : "Play"}
        </button>
        <button
          type="button"
          className="audio-bar__btn"
          aria-label="Next verse"
          disabled={verses.length === 0}
          onClick={() => skipVerse(1)}
        >
          ›
        </button>
        <button
          type="button"
          className="audio-bar__btn"
          aria-label="Next chapter"
          disabled={!canNextChapter}
          onClick={() => {
            stopPlayback(true);
            onRequestChapter(1);
          }}
        >
          ››
        </button>
      </div>

      <div className="audio-bar__side">
        <label className="audio-bar__speed">
          <span className="sr-only">Speed</span>
          <select
            value={rate}
            aria-label="Playback speed"
            onChange={(e) => changeRate(Number(e.target.value) as AudioRate)}
          >
            {AUDIO_RATES.map((value) => (
              <option key={value} value={value}>
                {value}×
              </option>
            ))}
          </select>
        </label>
        <button
          type="button"
          className="audio-bar__btn audio-bar__btn--ghost"
          aria-label="Close audio"
          onClick={() => {
            stopPlayback(true);
            onClose();
          }}
        >
          Close
        </button>
      </div>
    </div>
  );
}
