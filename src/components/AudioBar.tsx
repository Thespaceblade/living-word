"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { BibleVerse } from "@/lib/types";
import {
  AUDIO_RATES,
  getSavedAudioRate,
  resolveChapterAudio,
  saveAudioRate,
  type AudioRate,
  verseAtTime,
  verseIndex,
  verseStartTimes,
} from "@/lib/audio";

type Props = {
  version: string;
  book: string;
  slug: string;
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
  version,
  book,
  slug,
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
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const startsRef = useRef<number[]>([]);
  const versesRef = useRef(verses);
  const [playing, setPlaying] = useState(false);
  const [rate, setRate] = useState<AudioRate>(1);
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);

  const source = useMemo(
    () => resolveChapterAudio(version, slug, chapter),
    [version, slug, chapter],
  );

  useEffect(() => {
    setRate(getSavedAudioRate());
  }, []);

  useEffect(() => {
    versesRef.current = verses;
  }, [verses]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !open || !source) return;

    setReady(false);
    setFailed(false);
    setPlaying(false);
    onListeningVerse(null);
    audio.pause();
    audio.src = source.url;
    audio.load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, source?.url, chapter, slug, version]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.playbackRate = rate;
  }, [rate]);

  useEffect(() => {
    return () => {
      const audio = audioRef.current;
      if (!audio) return;
      audio.pause();
      audio.removeAttribute("src");
      audio.load();
    };
  }, []);

  function rebuildStarts(duration: number) {
    startsRef.current = verseStartTimes(versesRef.current, duration);
  }

  function syncHighlight(time: number) {
    const verse = verseAtTime(startsRef.current, versesRef.current, time);
    if (verse != null) onListeningVerse(verse);
  }

  async function togglePlay() {
    const audio = audioRef.current;
    if (!audio || !source || failed) return;

    if (!audio.paused) {
      audio.pause();
      setPlaying(false);
      return;
    }

    try {
      if (!Number.isFinite(audio.duration) || audio.duration === 0) {
        await new Promise<void>((resolve, reject) => {
          const onReady = () => {
            cleanup();
            resolve();
          };
          const onError = () => {
            cleanup();
            reject(new Error("audio failed"));
          };
          const cleanup = () => {
            audio.removeEventListener("loadedmetadata", onReady);
            audio.removeEventListener("error", onError);
          };
          audio.addEventListener("loadedmetadata", onReady, { once: true });
          audio.addEventListener("error", onError, { once: true });
        });
      }
      rebuildStarts(audio.duration);
      if (listeningVerse == null && verses[0]) {
        onListeningVerse(verses[0].verse);
      } else if (listeningVerse != null) {
        const idx = verseIndex(verses, listeningVerse);
        const start = startsRef.current[idx] ?? 0;
        if (Math.abs(audio.currentTime - start) > 0.75) {
          audio.currentTime = start;
        }
      }
      audio.playbackRate = rate;
      await audio.play();
      setPlaying(true);
    } catch {
      setFailed(true);
      setPlaying(false);
    }
  }

  function skipVerse(delta: -1 | 1) {
    const audio = audioRef.current;
    if (!audio || !verses.length) return;
    const current = verseIndex(verses, listeningVerse ?? verses[0]?.verse ?? null);
    const next = Math.min(Math.max(current + delta, 0), verses.length - 1);
    if (!startsRef.current.length && Number.isFinite(audio.duration)) {
      rebuildStarts(audio.duration);
    }
    const start = startsRef.current[next] ?? 0;
    audio.currentTime = start;
    onListeningVerse(verses[next]!.verse);
  }

  function changeRate(next: AudioRate) {
    setRate(next);
    saveAudioRate(next);
    if (audioRef.current) audioRef.current.playbackRate = next;
  }

  if (!open) return null;

  const label =
    listeningVerse != null
      ? `${book} ${chapter}:${listeningVerse}`
      : `${book} ${chapter}`;

  return (
    <div className="audio-bar" role="region" aria-label="Audio Bible">
      <audio
        ref={audioRef}
        preload="metadata"
        onLoadedMetadata={(event) => {
          const audio = event.currentTarget;
          rebuildStarts(audio.duration);
          setReady(true);
          setFailed(false);
        }}
        onTimeUpdate={(event) => {
          syncHighlight(event.currentTarget.currentTime);
        }}
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onEnded={() => {
          setPlaying(false);
          onListeningVerse(null);
        }}
        onError={() => {
          setFailed(true);
          setPlaying(false);
        }}
      />

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
            audioRef.current?.pause();
            setPlaying(false);
            onListeningVerse(null);
            onRequestChapter(-1);
          }}
        >
          ‹‹
        </button>
        <button
          type="button"
          className="audio-bar__btn"
          aria-label="Previous verse"
          disabled={!verses.length || failed}
          onClick={() => skipVerse(-1)}
        >
          ‹
        </button>
        <button
          type="button"
          className={`audio-bar__btn audio-bar__btn--play ${playing ? "is-active" : ""}`}
          aria-label={playing ? "Pause" : "Play"}
          disabled={!source || failed}
          onClick={() => {
            void togglePlay();
          }}
        >
          {playing ? "Pause" : "Play"}
        </button>
        <button
          type="button"
          className="audio-bar__btn"
          aria-label="Next verse"
          disabled={!verses.length || failed}
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
            audioRef.current?.pause();
            setPlaying(false);
            onListeningVerse(null);
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
            audioRef.current?.pause();
            setPlaying(false);
            onListeningVerse(null);
            onClose();
          }}
        >
          Close
        </button>
      </div>

      {failed ? (
        <p className="audio-bar__warn" role="status">
          Audio unavailable for this chapter.
        </p>
      ) : null}
      {!failed && source && !ready ? (
        <p className="sr-only" role="status">
          Loading audio
        </p>
      ) : null}
    </div>
  );
}
