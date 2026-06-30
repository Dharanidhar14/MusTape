"use client";

import { Pause, Play, Volume2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";

function formatTime(value: number) {
  if (!Number.isFinite(value)) return "0:00";
  const minutes = Math.floor(value / 60);
  const seconds = Math.floor(value % 60);
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

export function LocalAudioPlayer({
  src,
  title,
  onPlayingChange
}: {
  src: string;
  title: string;
  onPlayingChange?: (isPlaying: boolean) => void;
}) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [volume, setVolume] = useState(0.82);
  const [speed, setSpeed] = useState(1);

  useEffect(() => {
    onPlayingChange?.(isPlaying);
  }, [isPlaying, onPlayingChange]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.volume = volume;
  }, [volume]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.playbackRate = speed;
  }, [speed]);

  async function togglePlayback() {
    const audio = audioRef.current;
    if (!audio) return;

    if (audio.paused) {
      await audio.play();
      return;
    }
    audio.pause();
  }

  function seek(value: number) {
    const audio = audioRef.current;
    if (!audio) return;
    audio.currentTime = value;
    setCurrentTime(value);
  }

  return (
    <div className="rounded-[1.15rem] border border-[rgb(var(--border))] bg-[rgb(var(--paper-100)/0.82)] p-4 shadow-insetpaper">
      <audio
        ref={audioRef}
        src={src}
        preload="metadata"
        onLoadedMetadata={(event) => setDuration(event.currentTarget.duration || 0)}
        onTimeUpdate={(event) => setCurrentTime(event.currentTarget.currentTime)}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        onEnded={() => setIsPlaying(false)}
      >
        <track kind="captions" />
      </audio>

      <div className="grid gap-4">
        <div className="flex items-center gap-3">
          <button
            type="button"
            aria-label={isPlaying ? `Pause ${title}` : `Play ${title}`}
            onClick={togglePlayback}
            className="touch-target grid shrink-0 place-items-center rounded-full bg-ink-900 text-paper-100 transition duration-200 ease-gentle hover:bg-rosewood active:scale-95"
          >
            {isPlaying ? <Pause className="h-4 w-4 fill-current" /> : <Play className="ml-0.5 h-4 w-4 fill-current" />}
          </button>
          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between gap-3 font-mono text-[0.72rem] uppercase tracking-[0.14em] text-ink-400">
              <span>{formatTime(currentTime)}</span>
              <span>{formatTime(duration)}</span>
            </div>
            <input
              aria-label={`Seek ${title}`}
              type="range"
              min={0}
              max={duration || 0}
              step="0.01"
              value={Math.min(currentTime, duration || 0)}
              onChange={(event) => seek(Number(event.target.value))}
              className="audio-range mt-2 w-full"
            />
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-[1fr_auto] sm:items-center">
          <label className="flex min-h-11 items-center gap-3 rounded-full border border-[rgb(var(--border))] bg-[rgb(var(--surface)/0.58)] px-3 text-sm text-ink-500">
            <Volume2 className="h-4 w-4 shrink-0 text-ink-400" />
            <span className="sr-only">Volume</span>
            <input
              aria-label="Volume"
              type="range"
              min={0}
              max={1}
              step="0.01"
              value={volume}
              onChange={(event) => setVolume(Number(event.target.value))}
              className="audio-range w-full"
            />
          </label>

          <label className="flex min-h-11 items-center justify-between gap-3 rounded-full border border-[rgb(var(--border))] bg-[rgb(var(--surface)/0.58)] px-4 text-sm text-ink-500">
            <span>Speed</span>
            <select
              aria-label="Playback speed"
              value={speed}
              onChange={(event) => setSpeed(Number(event.target.value))}
              className="bg-transparent text-ink-800 focus:outline-none"
            >
              <option value={0.75}>0.75x</option>
              <option value={1}>1x</option>
              <option value={1.25}>1.25x</option>
              <option value={1.5}>1.5x</option>
            </select>
          </label>
        </div>
      </div>
    </div>
  );
}
