"use client";

import { motion, useReducedMotion } from "framer-motion";
import { ArrowLeft, CassetteTape, FileAudio, Music2, Play, Sparkles } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
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
  const [opened, setOpened] = useState(preview);
  const [activeSongId, setActiveSongId] = useState(tape.songs[0]?.id || "");
  const [reelsActive, setReelsActive] = useState(false);
  const shouldReduceMotion = useReducedMotion();
  const activeSong = tape.songs.find((song) => song.id === activeSongId) || tape.songs[0];

  return (
    <main className="min-h-screen overflow-x-hidden text-ink-800">
      <section className="paper-grain cinematic-room min-h-screen px-5 py-5 sm:px-8 lg:px-10">
        <div className="mx-auto flex min-h-[calc(100vh-2.5rem)] w-full max-w-6xl flex-col">
          <header className="relative z-10 flex items-center justify-between gap-4">
            {preview ? (
              <button type="button" onClick={onReturn} className="group flex touch-target items-center gap-3 rounded-full text-sm text-ink-600 transition hover:text-ink-900 active:scale-[0.98]">
                <span className="grid h-10 w-10 place-items-center rounded-full border border-[rgb(var(--border))] bg-[rgb(var(--surface)/0.72)] shadow-insetpaper">
                  <ArrowLeft aria-hidden className="h-4 w-4" />
                </span>
                <span className="font-display text-xl tracking-normal text-ink-900">Return to Editing</span>
              </button>
            ) : (
              <Link href="/" className="group flex items-center gap-3 rounded-full text-sm text-ink-600 transition hover:text-ink-900">
                <span className="grid h-10 w-10 place-items-center rounded-full border border-[rgb(var(--border))] bg-[rgb(var(--surface)/0.72)] shadow-insetpaper">
                  <ArrowLeft aria-hidden className="h-4 w-4" />
                </span>
                <span className="font-display text-xl tracking-normal text-ink-900">Return</span>
              </Link>
            )}
            <span className="inline-flex items-center gap-2 rounded-full border border-[rgb(var(--border))] bg-[rgb(var(--surface)/0.72)] px-4 py-3 text-sm text-ink-600 shadow-insetpaper">
              <Music2 className="h-4 w-4" />
              MusTape
            </span>
          </header>

          <div className="relative z-10 grid flex-1 items-center gap-10 py-12">
            <div className="grid gap-12 lg:grid-cols-[0.82fr_1.18fr] lg:items-center">
              <motion.section
                initial={shouldReduceMotion ? false : { opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, ease: "easeOut" }}
                className="max-w-xl"
              >
                <p className="mb-6 inline-flex items-center gap-2 rounded-full border border-[rgb(var(--border))] bg-[rgb(var(--surface)/0.58)] px-3 py-2 text-xs uppercase tracking-[0.18em] text-ink-500">
                  <Sparkles className="h-3.5 w-3.5" />
                  A tape for {tape.recipient}
                </p>
                <h1 className="break-words font-display text-[clamp(3.3rem,8vw,7.2rem)] leading-[0.9] text-ink-900">
                  {tape.title}
                </h1>
                <p className="mt-7 max-w-lg break-words text-xl leading-9 text-ink-600">{tape.inscription}</p>
                {tape.senderNote ? <p className="mt-5 max-w-lg break-words text-base leading-7 text-ink-500">{tape.senderNote}</p> : null}
                {!opened ? (
                  <button
                    type="button"
                    onClick={() => setOpened(true)}
                    className="touch-target mt-9 inline-flex items-center justify-center gap-3 rounded-full bg-rosewood px-5 text-sm font-medium text-paper-100 transition duration-200 ease-gentle hover:bg-ink-900 active:scale-95"
                  >
                    <Play className="h-4 w-4 fill-current" />
                    Open Tape
                  </button>
                ) : null}
              </motion.section>

              <motion.section
                initial={shouldReduceMotion ? false : { opacity: 0, scale: 0.97, y: 18 }}
                animate={{ opacity: opened ? 1 : 0.92, scale: opened ? 1 : 0.985, y: 0 }}
                transition={{ duration: 0.75, ease: [0.22, 1, 0.36, 1] }}
                className="rounded-[2rem] border border-[rgb(var(--border))] bg-[rgb(var(--surface)/0.9)] p-5 shadow-object shadow-insetpaper sm:p-7"
              >
                <div className="rounded-[1.45rem] border border-[rgb(var(--border))] bg-[rgb(var(--paper-100))] p-5">
                  <div className="flex items-start justify-between gap-4 border-b border-[rgb(var(--border))] pb-5">
                    <div className="min-w-0">
                      <p className="font-mono text-xs uppercase tracking-[0.18em] text-ink-400">Sealed tape</p>
                      <h2 className="mt-3 break-words font-display text-4xl text-ink-900">{tape.recipient}</h2>
                    </div>
                    <CassetteTape className="h-5 w-5 shrink-0 text-rosewood" />
                  </div>

                  <div className="my-7 grid grid-cols-[1fr_auto_1fr] items-center gap-4">
                    <Reel spin="left" active={reelsActive} />
                    <div className="grid h-16 w-16 place-items-center rounded-full bg-ink-900 text-paper-100 shadow-insetpaper">
                      <Play className="ml-1 h-6 w-6 fill-current" />
                    </div>
                    <Reel spin="right" active={reelsActive} />
                  </div>

                  {activeSong ? (
                    <div className="rounded-[1.2rem] bg-[rgb(var(--surface-muted))] p-4">
                      <p className="font-mono text-xs uppercase tracking-[0.18em] text-ink-400">
                        Current trace / {activeSong.type}
                      </p>
                      <h3 className="mt-2 break-words text-2xl font-medium text-ink-900">{activeSong.title}</h3>
                      {"artist" in activeSong && activeSong.artist ? <p className="mt-1 break-words text-sm text-ink-500">{activeSong.artist}</p> : null}
                      {activeSong.memory ? <p className="mt-3 break-words leading-7 text-ink-600">{activeSong.memory}</p> : null}
                      {activeSong.type === "local" ? (
                        <div className="mt-4">
                          <LocalAudioPlayer src={activeSong.audioUrl} title={activeSong.title} onPlayingChange={setReelsActive} />
                        </div>
                      ) : (
                        <iframe
                          title={`Spotify player for ${activeSong.title}`}
                          src={activeSong.embedUrl}
                          width="100%"
                          height="152"
                          allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                          loading="lazy"
                          className="mt-4 block rounded-[0.9rem] border-0"
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
                          setActiveSongId(song.id);
                          setReelsActive(false);
                        }}
                        className={`group rounded-[1rem] border p-4 text-left transition duration-200 ease-gentle hover:-translate-y-0.5 hover:border-brass ${
                          song.id === activeSong?.id ? "border-rosewood bg-rosewood/8" : "border-[rgb(var(--border))] bg-[rgb(var(--paper-100)/0.58)]"
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <span className="font-mono text-xs uppercase tracking-[0.18em] text-ink-400">{String(index + 1).padStart(2, "0")}</span>
                          <span className="min-w-0">
                            <span className="block break-words text-base font-medium text-ink-900">{song.title}</span>
                            {song.type === "local" ? (
                              <span className="mt-1 inline-flex items-center gap-2 text-sm text-ink-500">
                                <FileAudio className="h-4 w-4" />
                                Uploaded sound
                              </span>
                            ) : (
                              <span className="mt-1 block text-sm text-ink-500">Spotify trace</span>
                            )}
                          </span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              </motion.section>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
