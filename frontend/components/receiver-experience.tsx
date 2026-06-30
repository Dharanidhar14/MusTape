"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ArrowLeft, CassetteTape, FileAudio, Music2, Play, Sparkles } from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { BrandLogo } from "@/components/brand-logo";
import { EndingFooter } from "@/components/ending-footer";
import { ExternalMediaEmbed } from "@/components/external-media-embed";
import { LocalAudioPlayer } from "@/components/local-audio-player";
import { Reel } from "@/components/reel";
import type { SavedTape } from "@/lib/mustape";

export function ReceiverExperience({
  tape,
  preview = false,
  onReturn
}: {
  tape: SavedTape;
  preview?: boolean;
  onReturn?: () => void;
}) {
  const sessionKey = useMemo(() => `mustape-opened-${tape.shareId}`, [tape.shareId]);
  const [opened, setOpened] = useState(false);
  const [activeSongId, setActiveSongId] = useState(tape.songs[0]?.id || "");
  const [reelsActive, setReelsActive] = useState(false);
  const shouldReduceMotion = useReducedMotion();
  const activeSong = tape.songs.find((song) => song.id === activeSongId) || tape.songs[0];

  useEffect(() => {
    if (preview) return;
    setOpened(window.sessionStorage.getItem(sessionKey) === "true");
  }, [preview, sessionKey]);

  useEffect(() => {
    const savedTheme = window.localStorage.getItem("mustape-theme");
    if (savedTheme === "light" || savedTheme === "dark") {
      document.documentElement.dataset.theme = savedTheme;
      document.body.dataset.theme = savedTheme;
    }
  }, []);

  function openTape() {
    setOpened(true);
    if (!preview) window.sessionStorage.setItem(sessionKey, "true");
  }

  return (
    <main className="min-h-screen w-full overflow-x-hidden text-ink-800">
      <section className="paper-grain cinematic-room min-h-[108vh] px-5 py-6 sm:px-8 sm:py-7 lg:px-10">
        <div className="mx-auto flex min-h-[calc(108vh-3rem)] w-full max-w-[78rem] flex-col">
          <header className="relative z-10 flex items-center justify-between gap-4">
            <BrandLogo href="/" />
            {preview ? (
              <button type="button" onClick={onReturn} className="button-lift group flex touch-target items-center gap-3 rounded-full text-sm text-ink-600 hover:text-ink-900">
                <span className="icon-button rounded-full border border-[rgb(var(--border))] bg-[rgb(var(--surface)/0.72)] shadow-insetpaper">
                  <ArrowLeft aria-hidden className="h-4 w-4" />
                </span>
                <span className="hidden font-display text-xl tracking-normal text-ink-900 sm:inline">Return to Editing</span>
              </button>
            ) : (
              <Link href="/" className="button-lift group flex touch-target items-center gap-3 rounded-full text-sm text-ink-600 hover:text-ink-900">
                <span className="icon-button rounded-full border border-[rgb(var(--border))] bg-[rgb(var(--surface)/0.72)] shadow-insetpaper">
                  <ArrowLeft aria-hidden className="h-4 w-4" />
                </span>
                <span className="hidden font-display text-xl tracking-normal text-ink-900 sm:inline">Return</span>
              </Link>
            )}
          </header>

          <div className="relative z-10 grid flex-1 items-center py-16">
            <AnimatePresence mode="wait">
              {!opened ? (
                <SealedTape key="sealed" tape={tape} onOpen={openTape} shouldReduceMotion={Boolean(shouldReduceMotion)} />
              ) : (
                <motion.div
                  key="opened"
                  initial={shouldReduceMotion ? false : { opacity: 0, y: 18, filter: "blur(10px)" }}
                  animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                  exit={{ opacity: 0, y: -12 }}
                  transition={{ duration: 0.72, ease: [0.22, 1, 0.36, 1] }}
                  className="grid gap-14"
                >
                  <div className="grid gap-14 lg:grid-cols-[0.82fr_1.18fr] lg:items-center">
                    <section className="max-w-2xl">
                      <p className="mb-6 inline-flex items-center gap-2 rounded-full border border-[rgb(var(--border))] bg-[rgb(var(--surface)/0.58)] px-3 py-2 text-xs uppercase tracking-[0.18em] text-ink-500">
                        <Sparkles className="icon-svg h-3.5 w-3.5" />
                        A tape for {tape.recipient}
                      </p>
                      <h1 className="break-words font-display text-[clamp(3.6rem,8.6vw,8rem)] leading-[0.885] text-ink-900">
                        {tape.title}
                      </h1>
                      {tape.senderNote ? <p className="mt-8 max-w-xl break-words text-lg leading-8 text-ink-500">{tape.senderNote}</p> : null}
                    </section>

                    <TapePlayer
                      tape={tape}
                      activeSong={activeSong}
                      activeSongId={activeSong?.id || ""}
                      reelsActive={reelsActive}
                      shouldReduceMotion={Boolean(shouldReduceMotion)}
                      onSelectSong={(songId) => {
                        setActiveSongId(songId);
                        setReelsActive(false);
                      }}
                      onPlayingChange={setReelsActive}
                    />
                  </div>

                  <section className="letter-card rounded-[1.7rem] border p-7 sm:p-9" aria-labelledby="note-for-them">
                    <p id="note-for-them" className="font-display text-[clamp(2.35rem,4vw,4rem)] leading-none text-ink-900">
                      A Note for Them
                    </p>
                    <p className="mt-7 max-w-3xl break-words text-xl leading-9 text-ink-600">
                      {tape.inscription}
                    </p>
                  </section>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </section>
      <EndingFooter />
    </main>
  );
}

function SealedTape({
  tape,
  onOpen,
  shouldReduceMotion
}: {
  tape: SavedTape;
  onOpen: () => void;
  shouldReduceMotion: boolean;
}) {
  return (
    <motion.section
      initial={shouldReduceMotion ? false : { opacity: 0, y: 18, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={shouldReduceMotion ? undefined : { opacity: 0, y: -16, scale: 0.985, filter: "blur(8px)" }}
      transition={{ duration: 0.72, ease: [0.22, 1, 0.36, 1] }}
      className="mx-auto grid w-full max-w-4xl place-items-center text-center"
    >
      <motion.div
        animate={shouldReduceMotion ? undefined : { y: [0, -5, 0] }}
        transition={{ duration: 7.5, repeat: Infinity, ease: "easeInOut" }}
        className="relative w-full rounded-[2.2rem] border border-[rgb(var(--border))] bg-[rgb(var(--surface)/0.78)] p-7 shadow-object shadow-insetpaper sm:p-10"
      >
        <div className="mx-auto grid h-28 w-44 place-items-center rounded-[1.5rem] border border-rosewood/25 bg-[rgb(var(--paper-100)/0.72)] shadow-insetpaper">
          <CassetteTape className="h-10 w-10 text-rosewood" />
        </div>
        <p className="mt-10 inline-flex items-center gap-2 rounded-full border border-[rgb(var(--border))] bg-[rgb(var(--paper-100)/0.68)] px-4 py-2 text-xs uppercase tracking-[0.18em] text-ink-500">
          This tape is still sealed
        </p>
        <h1 className="mx-auto mt-6 max-w-3xl break-words font-display text-[clamp(3.4rem,8vw,7.4rem)] leading-[0.9] text-ink-900">
          {tape.title}
        </h1>
        <p className="mt-7 text-xl leading-9 text-ink-600">A tape has been left for {tape.recipient}.</p>
        <p className="mx-auto mt-3 max-w-lg leading-7 text-ink-500">Open when the room gets quiet.</p>
        <button
          type="button"
          onClick={onOpen}
          className="button-lift touch-target mt-10 inline-flex items-center justify-center gap-3 rounded-full bg-rosewood px-7 text-sm font-medium text-paper-100 hover:bg-ink-900"
        >
          <Play className="icon-svg h-4 w-4 fill-current" />
          Open Tape
        </button>
      </motion.div>
    </motion.section>
  );
}

function TapePlayer({
  tape,
  activeSong,
  activeSongId,
  reelsActive,
  shouldReduceMotion,
  onSelectSong,
  onPlayingChange
}: {
  tape: SavedTape;
  activeSong: SavedTape["songs"][number] | undefined;
  activeSongId: string;
  reelsActive: boolean;
  shouldReduceMotion: boolean;
  onSelectSong: (songId: string) => void;
  onPlayingChange: (isPlaying: boolean) => void;
}) {
  const visualReelsActive = reelsActive || Boolean(activeSong && activeSong.type !== "local");

  return (
    <motion.section
      initial={shouldReduceMotion ? false : { opacity: 0, scale: 0.97, y: 18 }}
      animate={{
        opacity: 1,
        scale: 1,
        y: shouldReduceMotion ? 0 : [0, -4, 0]
      }}
      transition={{
        opacity: { duration: 0.75, ease: [0.22, 1, 0.36, 1] },
        scale: { duration: 0.75, ease: [0.22, 1, 0.36, 1] },
        y: { duration: 7.5, repeat: Infinity, ease: "easeInOut" }
      }}
      className="rounded-[2rem] border border-[rgb(var(--border))] bg-[rgb(var(--surface)/0.9)] p-5 shadow-object shadow-insetpaper sm:p-7"
    >
      <div className="rounded-[1.45rem] border border-[rgb(var(--border))] bg-[rgb(var(--paper-100))] p-5">
        <div className="flex items-start justify-between gap-4 border-b border-[rgb(var(--border))] pb-5">
          <div className="min-w-0">
            <p className="font-mono text-xs uppercase tracking-[0.18em] text-ink-400">Opened tape</p>
            <h2 className="mt-3 break-words font-display text-4xl text-ink-900">{tape.recipient}</h2>
          </div>
          <CassetteTape className="icon-svg h-5 w-5 shrink-0 text-rosewood" />
        </div>

        <div className="my-7 grid grid-cols-[1fr_auto_1fr] items-center gap-4">
          <Reel spin="left" active={visualReelsActive} />
          <div className="grid h-16 w-16 place-items-center rounded-full bg-ink-900 text-paper-100 shadow-insetpaper">
            <Music2 className="h-6 w-6" />
          </div>
          <Reel spin="right" active={visualReelsActive} />
        </div>

        {activeSong ? (
          <div className="rounded-[1.2rem] bg-[rgb(var(--surface-muted))] p-4">
            <p className="font-mono text-xs uppercase tracking-[0.18em] text-ink-400">
              Current trace / {activeSong.type}
            </p>
            <h3 className="mt-2 break-words text-2xl font-medium text-ink-900">{activeSong.title}</h3>
            {activeSong.artist ? <p className="mt-1 break-words text-sm text-ink-500">{activeSong.artist}</p> : null}
            {activeSong.memory ? <p className="mt-3 break-words leading-7 text-ink-600">{activeSong.memory}</p> : null}
            {activeSong.type === "local" ? (
              <div className="mt-4">
                <LocalAudioPlayer src={activeSong.audioUrl} title={activeSong.title} onPlayingChange={onPlayingChange} />
              </div>
            ) : (
              <ExternalMediaEmbed
                provider={activeSong.type === "spotify" ? "Spotify" : "YouTube"}
                embedUrl={activeSong.embedUrl}
                sourceUrl={activeSong.type === "spotify" ? activeSong.spotifyUrl : activeSong.youtubeUrl}
                title={activeSong.title}
                onInteract={() => onPlayingChange(true)}
              />
            )}
          </div>
        ) : null}

        <div className="mt-5 grid gap-3">
          {tape.songs.map((song, index) => (
            <button
              type="button"
              key={song.id}
              onClick={() => {
                onSelectSong(song.id);
                onPlayingChange(song.type !== "local");
              }}
              className={`button-lift group rounded-[1rem] border p-4 text-left hover:border-brass ${
                song.id === activeSongId ? "border-rosewood bg-rosewood/8" : "border-[rgb(var(--border))] bg-[rgb(var(--paper-100)/0.58)]"
              }`}
            >
              <div className="flex items-start gap-3">
                <span className="font-mono text-xs uppercase tracking-[0.18em] text-ink-400">{String(index + 1).padStart(2, "0")}</span>
                <span className="min-w-0">
                  <span className="block break-words text-base font-medium text-ink-900">{song.title}</span>
                  {song.type === "local" ? (
                    <span className="mt-1 inline-flex items-center gap-2 text-sm text-ink-500">
                      <FileAudio className="icon-svg h-4 w-4" />
                      Uploaded sound
                    </span>
                  ) : (
                    <span className="mt-1 block text-sm text-ink-500">{song.type === "spotify" ? "Spotify trace" : "YouTube trace"}</span>
                  )}
                </span>
              </div>
            </button>
          ))}
        </div>
      </div>
    </motion.section>
  );
}
