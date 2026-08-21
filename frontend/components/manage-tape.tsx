"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  ArrowDown,
  ArrowRight,
  ArrowUp,
  Check,
  ChevronLeft,
  Copy,
  Disc3,
  ExternalLink,
  FileAudio,
  Link,
  Loader2,
  Moon,
  Music2,
  Plus,
  Share2,
  Sparkles,
  Sun,
  Trash2,
  Upload
} from "lucide-react";
import Image from "next/image";
import NextLink from "next/link";
import { ChangeEvent, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { BrandLogo } from "@/components/brand-logo";
import { ErrorBoundary } from "@/components/error-boundary";
import { EndingFooter } from "@/components/ending-footer";
import { ExternalMediaEmbed } from "@/components/external-media-embed";
import { LocalAudioPlayer } from "@/components/local-audio-player";
import { Reel } from "@/components/reel";
import { IconButton } from "@/components/ui/button";
import { SectionTitle } from "@/components/ui/typography";
import { clientConfig } from "@/lib/config";
import { motionTokens, typographyTokens } from "@/lib/design-tokens";
import {
  buildShareUrl,
  deleteTape,
  extractSpotifyTrackId,
  extractYouTubeVideoId,
  fetchManageTape,
  newClientId,
  updateTape,
  validateAudioFile,
  type ComposerDraft,
  type ComposerSong,
  type SavedTape,
  type SavedSong
} from "@/lib/mustape";

// ── Helpers ──────────────────────────────────────────────────────────────────

/** Convert a SavedSong (from the API) into a ComposerSong (for the editor).
 *  Local songs cannot be reconstructed from the server (we have no File object),
 *  so they are represented as a placeholder that the sender must re-upload if
 *  they want to change them. We store the server-side fileName so the backend
 *  can detect no-ops (the song wasn't replaced). However, for simplicity and
 *  safety we omit local songs from the editable draft — the sender sees them
 *  listed but cannot re-use the File object from the backend. They can remove
 *  them and re-upload. Spotify/YouTube songs are fully editable.
 */
function savedSongToComposer(song: SavedSong): ComposerSong | null {
  if (song.type === "spotify") {
    return {
      clientId: song.id,
      type: "spotify",
      title: song.title,
      artist: song.artist,
      memory: song.memory,
      spotifyUrl: song.spotifyUrl,
      spotifyTrackId: song.spotifyTrackId,
      embedUrl: song.embedUrl
    };
  }
  if (song.type === "youtube") {
    return {
      clientId: song.id,
      type: "youtube",
      title: song.title,
      artist: song.artist,
      memory: song.memory,
      youtubeUrl: song.youtubeUrl,
      youtubeVideoId: song.youtubeVideoId,
      embedUrl: song.embedUrl
    };
  }
  // Local songs: cannot reconstruct a File object from the server.
  // We drop them from the editable draft and show a warning to the sender.
  return null;
}

function savedTapeToDraft(tape: SavedTape): ComposerDraft {
  return {
    recipient: tape.recipient,
    title: tape.title,
    inscription: tape.inscription,
    senderNote: tape.senderNote,
    // Local songs are omitted — sender must re-upload them if they want to change
    songs: tape.songs.map(savedSongToComposer).filter(Boolean) as ComposerSong[]
  };
}

// ── Component ─────────────────────────────────────────────────────────────────

export function ManageTape({ managementToken }: { managementToken: string }) {
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [tape, setTape] = useState<SavedTape | null>(null);

  useEffect(() => {
    let alive = true;
    fetchManageTape(managementToken)
      .then((t) => { if (alive) { setTape(t); setLoading(false); } })
      .catch((err) => { if (alive) { setLoadError(err instanceof Error ? err.message : "This management link could not be found."); setLoading(false); } });
    return () => { alive = false; };
  }, [managementToken]);

  if (loading) {
    return (
      <main className="min-h-screen overflow-x-hidden text-ink-800">
        <section className="paper-grain cinematic-room grid min-h-screen place-items-center px-5 py-10">
          <div className="relative z-10 mx-auto flex items-center gap-3 rounded-full border border-[rgb(var(--border))] bg-[rgb(var(--surface)/0.72)] px-5 py-4 text-ink-600 shadow-insetpaper">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading tape…
          </div>
        </section>
      </main>
    );
  }

  if (loadError || !tape) {
    return (
      <main className="min-h-screen overflow-x-hidden text-ink-800">
        <section className="paper-grain cinematic-room grid min-h-screen place-items-center px-5 py-10">
          <div className="relative z-10 mx-auto max-w-xl rounded-[2rem] border border-oxblood/30 bg-[rgb(var(--surface)/0.78)] p-8 text-center shadow-object">
            <p className="font-display text-4xl text-ink-900">The envelope is quiet.</p>
            <p className="mt-4 leading-7 text-ink-500">{loadError || "This management link could not be found."}</p>
            <NextLink href="/" className="touch-target mt-7 inline-flex items-center justify-center rounded-full bg-rosewood px-5 text-sm text-paper-100 transition hover:bg-ink-900">
              Return
            </NextLink>
          </div>
        </section>
      </main>
    );
  }

  return (
    <ErrorBoundary label="Something slipped while loading the management studio.">
      <ManageEditor
        tape={tape}
        managementToken={managementToken}
      />
    </ErrorBoundary>
  );
}

// ── Editor ────────────────────────────────────────────────────────────────────

function ManageEditor({ tape, managementToken }: { tape: SavedTape; managementToken: string }) {
  const [draft, setDraft] = useState<ComposerDraft>(() => savedTapeToDraft(tape));
  const [shareId] = useState(tape.shareId);
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [spotifyUrl, setSpotifyUrl] = useState("");
  const [localTitle, setLocalTitle] = useState("");
  const [localArtist, setLocalArtist] = useState("");
  const [localFile, setLocalFile] = useState<File | null>(null);
  const [activeSong, setActiveSong] = useState(0);
  const [reelsActive, setReelsActive] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [deleted, setDeleted] = useState(false);
  const [copied, setCopied] = useState(false);

  // Blob URL lifecycle (Fix 4) — same pattern as mustape-app.tsx
  const blobUrlMap = useRef<Map<string, string>>(new Map());

  const getOrCreateBlobUrl = useCallback((song: ComposerSong & { type: "local" }): string => {
    const existing = blobUrlMap.current.get(song.clientId);
    if (existing) return existing;
    const url = URL.createObjectURL(song.file);
    blobUrlMap.current.set(song.clientId, url);
    return url;
  }, []);

  const revokeBlobUrl = useCallback((clientId: string) => {
    const url = blobUrlMap.current.get(clientId);
    if (url) { URL.revokeObjectURL(url); blobUrlMap.current.delete(clientId); }
  }, []);

  useEffect(() => {
    const map = blobUrlMap.current;
    return () => { map.forEach((url) => URL.revokeObjectURL(url)); map.clear(); };
  }, []);

  useEffect(() => {
    const savedTheme = window.localStorage.getItem(clientConfig.themeStorageKey);
    if (savedTheme === "light" || savedTheme === "dark") setTheme(savedTheme as "light" | "dark");
  }, []);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    document.body.dataset.theme = theme;
    window.localStorage.setItem(clientConfig.themeStorageKey, theme);
  }, [theme]);

  const shareLink = buildShareUrl(`/tape/${shareId}`);
  const localSongsOnServer = useMemo(
    () => tape.songs.filter((s) => s.type === "local"),
    [tape.songs]
  );
  const shouldReduceMotion = useReducedMotion();
  const currentSong = draft.songs[activeSong];

  function updateDraft<K extends keyof ComposerDraft>(key: K, value: ComposerDraft[K]) {
    setDraft((c) => ({ ...c, [key]: value }));
  }

  function addSpotifySong() {
    setError("");
    const trackId = extractSpotifyTrackId(spotifyUrl);
    const youtubeVideoId = extractYouTubeVideoId(spotifyUrl);
    let song: ComposerSong;

    if (trackId) {
      song = { clientId: newClientId(), type: "spotify", title: "Spotify Track", artist: "", memory: "", spotifyUrl: spotifyUrl.trim(), spotifyTrackId: trackId, embedUrl: `https://open.spotify.com/embed/track/${trackId}` };
    } else if (youtubeVideoId) {
      song = { clientId: newClientId(), type: "youtube", title: "YouTube Track", artist: "", memory: "", youtubeUrl: spotifyUrl.trim(), youtubeVideoId, embedUrl: `https://www.youtube.com/embed/${youtubeVideoId}` };
    } else {
      setError("Paste a valid Spotify track link, Spotify URI, or YouTube link before placing it on the tape.");
      return;
    }

    setDraft((c) => ({ ...c, songs: [...c.songs, song] }));
    setActiveSong(draft.songs.length);
    setSpotifyUrl("");
  }

  function onChooseLocalFile(event: ChangeEvent<HTMLInputElement>) {
    setError("");
    const file = event.target.files?.[0];
    if (!file) return;
    if (!validateAudioFile(file)) { setError("Only mp3, wav, m4a, and ogg songs can be uploaded."); event.target.value = ""; return; }
    setLocalFile(file);
    if (!localTitle) setLocalTitle(file.name.replace(/\.[^/.]+$/, ""));
  }

  const fileInputRef = useRef<HTMLInputElement>(null);

  function addLocalSong() {
    setError("");
    if (!localFile) { setError("Choose a song file before placing it on the tape."); return; }
    if (!localTitle.trim()) { setError("Give the local song a name before placing it on the tape."); return; }

    const song: ComposerSong = { clientId: newClientId(), type: "local", title: localTitle.trim(), artist: localArtist.trim(), memory: "", file: localFile };
    getOrCreateBlobUrl(song);

    setDraft((c) => ({ ...c, songs: [...c.songs, song] }));
    setActiveSong(draft.songs.length);
    setLocalFile(null);
    setLocalTitle("");
    setLocalArtist("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  function updateSong(clientId: string, patch: Partial<ComposerSong>) {
    setDraft((c) => ({ ...c, songs: c.songs.map((s) => (s.clientId === clientId ? ({ ...s, ...patch } as ComposerSong) : s)) }));
  }

  function removeSong(clientId: string) {
    revokeBlobUrl(clientId);
    setDraft((c) => {
      const nextSongs = c.songs.filter((s) => s.clientId !== clientId);
      setActiveSong((i) => Math.max(0, Math.min(i, nextSongs.length - 1)));
      return { ...c, songs: nextSongs };
    });
  }

  function moveSong(index: number, direction: -1 | 1) {
    setDraft((c) => {
      const target = index + direction;
      if (target < 0 || target >= c.songs.length) return c;
      const songs = [...c.songs];
      [songs[index], songs[target]] = [songs[target], songs[index]];
      setActiveSong(target);
      return { ...c, songs };
    });
  }

  function validateDraft() {
    if (!draft.recipient.trim()) return "Add the recipient before saving.";
    if (!draft.title.trim()) return "Give the tape a title before saving.";
    if (!draft.inscription.trim()) return "Write a note for them before saving.";
    if (!draft.songs.length) return "The tape needs at least one song.";
    return "";
  }

  async function saveTape() {
    const message = validateDraft();
    if (message) { setError(message); return; }
    setIsSaving(true);
    setError("");
    setSaved(false);
    try {
      await updateTape(shareId, managementToken, draft);
      setSaved(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "The tape could not be saved.");
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDelete() {
    if (!deleteConfirm) { setDeleteConfirm(true); return; }
    setIsDeleting(true);
    setError("");
    try {
      await deleteTape(shareId, managementToken);
      setDeleted(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "The tape could not be deleted.");
      setDeleteConfirm(false);
    } finally {
      setIsDeleting(false);
    }
  }

  async function copyShareLink() {
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(shareLink);
      } else {
        const ta = document.createElement("textarea");
        ta.value = shareLink;
        ta.setAttribute("readonly", "");
        ta.style.cssText = "position:fixed;opacity:0";
        document.body.appendChild(ta);
        ta.select();
        document.execCommand("copy");
        document.body.removeChild(ta);
      }
      setCopied(true);
    } catch { /* ignore */ }
  }

  if (deleted) {
    return (
      <main className="min-h-screen overflow-x-hidden text-ink-800">
        <section className="paper-grain cinematic-room grid min-h-screen place-items-center px-5 py-10">
          <div className="relative z-10 mx-auto max-w-xl rounded-[2rem] border border-[rgb(var(--border))] bg-[rgb(var(--surface)/0.78)] p-8 text-center shadow-object shadow-insetpaper">
            <p className="font-display text-4xl text-ink-900">The tape is gone.</p>
            <p className="mt-4 leading-7 text-ink-500">It has been permanently erased. The receiver link will no longer work.</p>
            <NextLink href="/" className="touch-target mt-7 inline-flex items-center justify-center rounded-full bg-rosewood px-5 text-sm text-paper-100 transition hover:bg-ink-900">
              Make a new tape
            </NextLink>
          </div>
        </section>
      </main>
    );
  }

  const localSrc = currentSong?.type === "local" ? blobUrlMap.current.get(currentSong.clientId) ?? "" : "";

  return (
    <main data-theme={theme} className="min-h-screen w-full overflow-x-hidden text-ink-800">
      <section className="paper-grain cinematic-room min-h-[112vh] px-5 py-6 sm:px-8 sm:py-7 lg:px-10">
        <div className="mx-auto flex min-h-[calc(112vh-3rem)] w-full max-w-[84rem] flex-col">
          <header className="relative z-10 flex items-center justify-between gap-4">
            <BrandLogo href="/" />

            <nav aria-label="Management" className="hidden items-center gap-8 text-sm text-ink-500 md:flex">
              <span className="rounded-full border border-rosewood/30 bg-rosewood/8 px-3 py-1.5 text-xs uppercase tracking-[0.18em] text-rosewood">Managing tape</span>
            </nav>

            <div className="flex items-center gap-2">
              <button
                type="button"
                aria-label={`Switch to ${theme === "light" ? "dark" : "light"} mode`}
                onClick={() => setTheme(theme === "light" ? "dark" : "light")}
                className="button-lift icon-button rounded-full border border-[rgb(var(--border))] bg-[rgb(var(--surface)/0.72)] text-ink-600 hover:border-brass hover:text-ink-900"
              >
                {theme === "light" ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
              </button>
              <button
                type="button"
                onClick={saveTape}
                disabled={isSaving}
                className="button-lift touch-target inline-flex items-center gap-2 rounded-full bg-ink-900 px-5 text-sm text-paper-100 hover:bg-rosewood disabled:cursor-not-allowed disabled:opacity-60"
              >
                <Share2 className="icon-svg h-4 w-4" />
                <span className="hidden sm:inline">{isSaving ? "Saving" : "Save tape"}</span>
              </button>
            </div>
          </header>

          <div className="relative z-10 grid flex-1 items-center gap-14 py-16 lg:grid-cols-[0.86fr_1.14fr] lg:py-10">
            <section className="max-w-xl" aria-labelledby="manage-title">
              <motion.p
                initial={shouldReduceMotion ? false : { opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: motionTokens.durations.calm, ease: "easeOut" }}
                className="mb-6 inline-flex items-center gap-2 rounded-full border border-rosewood/30 bg-rosewood/8 px-3 py-2 text-xs uppercase tracking-[0.18em] text-rosewood"
              >
                <Sparkles className="h-3.5 w-3.5" />
                Managing this tape
              </motion.p>
              <motion.h1
                id="manage-title"
                initial={shouldReduceMotion ? false : { opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.08, duration: motionTokens.durations.reveal, ease: "easeOut" }}
                className="font-display text-[clamp(3.75rem,9.2vw,9.1rem)] leading-[0.875] tracking-normal text-ink-900"
              >
                {tape.title}
              </motion.h1>
              <motion.p
                initial={shouldReduceMotion ? false : { opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.16, duration: motionTokens.durations.reveal, ease: "easeOut" }}
                className="mt-8 max-w-xl text-[1.15rem] leading-9 text-ink-500"
              >
                A tape for <strong className="text-ink-700">{tape.recipient}</strong>. Edit and save to update the receiver link in place.
              </motion.p>
              <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                <a href={shareLink} target="_blank" rel="noopener noreferrer" className="button-lift touch-target inline-flex items-center justify-center gap-3 rounded-full border border-[rgb(var(--border))] bg-[rgb(var(--surface)/0.52)] px-6 text-sm font-medium text-ink-700 hover:border-brass hover:text-ink-900">
                  <ExternalLink className="icon-svg h-4 w-4" />
                  View receiver link
                </a>
              </div>
            </section>

            {/* Live tape preview — read blob URLs from map */}
            <ManagePreview
              draft={draft}
              currentSong={currentSong}
              activeSong={activeSong}
              reelsActive={reelsActive}
              localSrc={localSrc}
              onPlayingChange={setReelsActive}
              onPrevious={() => setActiveSong((i) => (i <= 0 ? Math.max(0, draft.songs.length - 1) : i - 1))}
              onNext={() => setActiveSong((i) => (i + 1 >= draft.songs.length ? 0 : i + 1))}
            />
          </div>
        </div>
      </section>

      <section className="relative bg-[rgb(var(--surface))] px-5 py-28 sm:px-8 lg:px-10">
        <div className="mx-auto max-w-[84rem]">

          {/* Local songs warning */}
          {localSongsOnServer.length > 0 ? (
            <div className="mb-10 rounded-[1.2rem] border border-brass/40 bg-brass/8 px-5 py-4 text-sm leading-7 text-ink-600">
              <strong className="font-medium text-ink-800">Local audio note:</strong> {localSongsOnServer.length} uploaded song{localSongsOnServer.length > 1 ? "s were" : " was"} loaded from the server. To keep them, re-upload the same file(s) before saving. They have been removed from the editor draft to avoid accidental deletion.
            </div>
          ) : null}

          <div className="grid gap-14 lg:grid-cols-[0.76fr_1.24fr]">
          <div>
            <p className="text-sm uppercase tracking-[0.18em] text-ink-400">Composition desk</p>
            <SectionTitle className="mt-5 max-w-md">Edit what needs changing.</SectionTitle>
          </div>
          <div className="grid gap-7">
            <div className="grid gap-6">
              <ManageField label="Recipient" value={draft.recipient} placeholder="Who am I making this for?" onChange={(v) => updateDraft("recipient", v)} />
              <ManageField label="Tape Title" value={draft.title} placeholder="Give this tape a name" onChange={(v) => updateDraft("title", v)} />
              <label className="block">
                <span className="mb-2 block text-sm text-ink-500">A Note for Them</span>
                <textarea
                  value={draft.inscription}
                  onChange={(e) => updateDraft("inscription", e.target.value)}
                  rows={4}
                  placeholder="Write the lines that opens the tape"
                  className="journal-field w-full resize-none rounded-[1.35rem] border px-6 py-5 text-lg leading-8 text-ink-800"
                />
              </label>
              <ManageField label="Sender note" value={draft.senderNote} placeholder="Optional closing trace" onChange={(v) => updateDraft("senderNote", v)} />
            </div>
          </div>
          </div>

          <div className="mt-12 grid gap-8">
            <div className="grid items-stretch gap-5 lg:grid-cols-2">
              <div className="button-lift grid h-full grid-rows-[auto_1fr_auto] gap-4 rounded-[1.6rem] border border-[rgb(var(--border))] bg-[rgb(var(--paper-100)/0.72)] p-5 shadow-insetpaper">
                <div className="flex items-center gap-3">
                  <Upload className="icon-svg h-5 w-5 text-rosewood" />
                  <h3 className="font-display text-[2rem] leading-none text-ink-900">Upload Local Song</h3>
                </div>
                <div className="grid gap-3">
                  <input ref={fileInputRef} type="file" accept=".mp3,.wav,.m4a,.ogg,audio/*" onChange={onChooseLocalFile} className="journal-field min-h-[3.875rem] w-full rounded-full border px-5 py-3 text-sm text-ink-600 file:mr-4 file:rounded-full file:border-0 file:bg-rosewood file:px-4 file:py-2 file:text-sm file:text-paper-100" />
                  <input value={localTitle} onChange={(e) => setLocalTitle(e.target.value)} placeholder="Custom song name" className="journal-field w-full rounded-full border px-6 text-base text-ink-800" />
                  <input value={localArtist} onChange={(e) => setLocalArtist(e.target.value)} placeholder="Artist, if remembered" className="journal-field w-full rounded-full border px-6 text-base text-ink-800" />
                  <button type="button" onClick={addLocalSong} className="button-lift touch-target inline-flex w-full items-center justify-center gap-2 rounded-full bg-ink-900 px-5 text-sm text-paper-100 hover:bg-rosewood">
                    <FileAudio className="icon-svg h-4 w-4" /> Upload Local Song
                  </button>
                </div>
                {localFile ? <p className="text-sm leading-6 text-ink-500">{localFile.name} is waiting at the edge of the tape.</p> : null}
              </div>

              <div className="button-lift grid h-full grid-rows-[auto_1fr_auto] gap-4 rounded-[1.6rem] border border-[rgb(var(--border))] bg-[rgb(var(--paper-100)/0.72)] p-5 shadow-insetpaper">
                <div className="flex items-center gap-3">
                  <Link className="icon-svg h-5 w-5 text-rosewood" />
                  <h3 className="font-display text-[2rem] leading-none text-ink-900">Add Spotify Song</h3>
                </div>
                <div className="grid content-start gap-3">
                  <input value={spotifyUrl} onChange={(e) => setSpotifyUrl(e.target.value)} placeholder="Spotify track link, spotify:track:..., or YouTube link" className="journal-field w-full rounded-full border px-6 text-base text-ink-800" />
                  <button type="button" onClick={addSpotifySong} className="button-lift touch-target inline-flex w-full items-center justify-center gap-2 rounded-full bg-ink-900 px-5 text-sm text-paper-100 hover:bg-rosewood">
                    <Plus className="icon-svg h-4 w-4" /> Add Spotify Song
                  </button>
                </div>
              </div>
            </div>

            <ManageSongList songs={draft.songs} activeSong={activeSong} onSelect={setActiveSong} onMove={moveSong} onRemove={removeSong} onUpdate={updateSong} />

            {/* Save / Delete panel */}
            <div className="grid gap-4 rounded-[1.35rem] border border-[rgb(var(--border))] bg-[rgb(var(--paper-100)/0.72)] p-5 shadow-insetpaper">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h3 className="font-display text-3xl text-ink-900">Save Changes</h3>
                  <p className="mt-2 text-sm text-ink-500">The receiver link stays the same — only the content changes.</p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={saveTape}
                    disabled={isSaving}
                    className="button-lift touch-target inline-flex items-center justify-center gap-2 rounded-full bg-rosewood px-6 text-sm text-paper-100 hover:bg-ink-900 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <Share2 className="icon-svg h-4 w-4" />
                    {isSaving ? "Saving…" : "Save Tape"}
                  </button>
                  <button
                    type="button"
                    onClick={handleDelete}
                    disabled={isDeleting}
                    className={`button-lift touch-target inline-flex items-center justify-center gap-2 rounded-full border px-4 text-sm disabled:cursor-not-allowed disabled:opacity-60 ${
                      deleteConfirm ? "border-oxblood bg-oxblood text-paper-100 hover:bg-oxblood/80" : "border-oxblood/30 text-oxblood hover:bg-oxblood/10"
                    }`}
                  >
                    <Trash2 className="icon-svg h-4 w-4" />
                    {isDeleting ? "Deleting…" : deleteConfirm ? "Confirm Delete" : "Delete Tape"}
                  </button>
                </div>
              </div>

              {deleteConfirm && !isDeleting ? (
                <p className="rounded-[1rem] bg-oxblood/10 px-4 py-3 text-sm text-oxblood">
                  This will permanently destroy the tape and all its uploaded audio.{" "}
                  <button type="button" onClick={() => setDeleteConfirm(false)} className="underline hover:no-underline">Cancel</button>
                </p>
              ) : null}
              {error ? <p role="alert" className="rounded-[1rem] bg-oxblood/10 px-4 py-3 text-sm text-oxblood">{error}</p> : null}
              {saved ? <p role="status" className="rounded-[1rem] bg-moss/10 px-4 py-3 text-sm text-moss">Changes saved. The receiver link still works.</p> : null}

              {/* Receiver link read-only display */}
              <div className="grid gap-3 rounded-[1.2rem] border border-brass/40 bg-brass/10 p-4 sm:grid-cols-[1fr_auto_auto] sm:items-center">
                <p className="break-all text-sm text-ink-700">{shareLink}</p>
                <button type="button" onClick={copyShareLink} className="button-lift touch-target inline-flex items-center justify-center gap-2 rounded-full border border-[rgb(var(--border))] bg-[rgb(var(--surface))] px-4 text-sm text-ink-700 hover:border-brass">
                  <Copy className="icon-svg h-4 w-4" />
                  {copied ? "Copied" : "Copy Link"}
                </button>
                <a href={shareLink} target="_blank" rel="noopener noreferrer" className="button-lift touch-target inline-flex items-center justify-center gap-2 rounded-full bg-ink-900 px-4 text-sm text-paper-100 hover:bg-rosewood">
                  <ExternalLink className="icon-svg h-4 w-4" />
                  Open Tape
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      <EndingFooter />
    </main>
  );
}

// ── Sub-components ─────────────────────────────────────────────────────────────

function ManageField({ label, value, placeholder, onChange }: { label: string; value: string; placeholder: string; onChange: (v: string) => void }) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm text-ink-500">{label}</span>
      <input value={value} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} className="journal-field w-full rounded-full border px-6 text-lg text-ink-800" />
    </label>
  );
}

function ManagePreview({ draft, currentSong, activeSong, reelsActive, localSrc, onPlayingChange, onPrevious, onNext }: {
  draft: ComposerDraft;
  currentSong?: ComposerSong;
  activeSong: number;
  reelsActive: boolean;
  localSrc: string;
  onPlayingChange: (v: boolean) => void;
  onPrevious: () => void;
  onNext: () => void;
}) {
  const shouldReduceMotion = useReducedMotion();
  const visualReelsActive = reelsActive || Boolean(currentSong && currentSong.type !== "local");

  return (
    <motion.section
      aria-label="Tape preview"
      initial={{ opacity: 0, scale: 0.97, y: 18 }}
      animate={{ opacity: 1, scale: 1, y: shouldReduceMotion ? 0 : [0, -4, 0] }}
      transition={{
        opacity: { duration: motionTokens.durations.object, ease: motionTokens.gentleEase },
        scale: { duration: motionTokens.durations.object, ease: motionTokens.gentleEase },
        y: { duration: motionTokens.durations.drift, repeat: Infinity, ease: "easeInOut" }
      }}
      className="relative mx-auto w-full max-w-2xl"
    >
      <div className="relative z-10 rounded-[2rem] border border-[rgb(var(--border))] bg-[rgb(var(--surface))] p-5 shadow-object shadow-insetpaper sm:p-7">
        <div className="rounded-[1.45rem] border border-[rgb(var(--border))] bg-[rgb(var(--paper-100))] p-5">
          <div className="flex items-start justify-between gap-4 border-b border-[rgb(var(--border))] pb-5">
            <div className="min-w-0">
              <p className={typographyTokens.caption}>Side A / {String(activeSong + 1).padStart(2, "0")}</p>
              <h2 className="mt-3 break-words font-display text-4xl leading-none text-ink-900">{draft.title || "Tape Title"}</h2>
            </div>
            <span className="shrink-0 rounded-full bg-rosewood/15 px-3 py-1 text-xs text-rosewood">Editing</span>
          </div>

          <div className="my-8 grid grid-cols-[1fr_auto_1fr] items-center gap-4 sm:gap-5">
            <Reel spin="left" active={visualReelsActive} />
            <div className="grid h-16 w-16 place-items-center rounded-full bg-ink-900 text-paper-100 shadow-insetpaper">
              <Music2 className="h-6 w-6" />
            </div>
            <Reel spin="right" active={visualReelsActive} />
          </div>

          <div className="rounded-[1.1rem] bg-[rgb(var(--surface-muted))] p-5">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentSong?.clientId || "empty"}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: motionTokens.durations.fast }}
              >
                {currentSong ? (
                  <>
                    <p className={typographyTokens.caption}>{currentSong.type === "spotify" ? "Spotify trace" : currentSong.type === "youtube" ? "YouTube trace" : "Local trace"}</p>
                    <h3 className="mt-2 break-words text-2xl font-medium text-ink-900">{currentSong.title}</h3>
                    {currentSong.artist ? <p className="mt-1 break-words text-sm text-ink-500">{currentSong.artist}</p> : null}
                  {currentSong.memory ? (
                    <p className="mt-5 max-w-md break-words text-lg leading-8 text-ink-600">{currentSong.memory}</p>
                  ) : null}
                    {currentSong.type === "local" ? (
                      <div className="mt-5">{localSrc ? <LocalAudioPlayer src={localSrc} title={currentSong.title} onPlayingChange={onPlayingChange} /> : null}</div>
                    ) : (
                      <ExternalMediaEmbed
                        provider={currentSong.type === "spotify" ? "Spotify" : "YouTube"}
                        embedUrl={currentSong.embedUrl}
                        sourceUrl={currentSong.type === "spotify" ? currentSong.spotifyUrl : currentSong.youtubeUrl}
                        title={currentSong.title}
                        onInteract={() => onPlayingChange(true)}
                      />
                    )}
                  </>
                ) : (
                  <div className="py-6">
                    <p className="font-display text-3xl text-ink-900">No pulse has been placed yet.</p>
                    <p className="mt-4 leading-7 text-ink-500">Paste a Spotify link or upload a song that remembers.</p>
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          </div>

          <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex gap-2">
              <IconButton aria-label="Back" onClick={onPrevious} disabled={!draft.songs.length}><ChevronLeft className="h-4 w-4" /></IconButton>
              <IconButton aria-label="Next song" onClick={onNext} disabled={!draft.songs.length}><ArrowRight className="h-4 w-4" /></IconButton>
            </div>
            <span className="inline-flex shrink-0 items-center gap-2 text-sm text-ink-500">
              <Check className="h-4 w-4 text-moss" />
              {draft.songs.length} {draft.songs.length === 1 ? "trace" : "traces"}
            </span>
          </div>
        </div>
        <div className="mt-5 flex items-center justify-between gap-3 px-2 text-sm text-ink-500">
          <span className="min-w-0 break-words">{draft.title || "Untitled tape"}</span>
        </div>
      </div>
    </motion.section>
  );
}

function ManageSongList({ songs, activeSong, onSelect, onMove, onRemove, onUpdate }: {
  songs: ComposerSong[];
  activeSong: number;
  onSelect: (i: number) => void;
  onMove: (i: number, d: -1 | 1) => void;
  onRemove: (id: string) => void;
  onUpdate: (id: string, patch: Partial<ComposerSong>) => void;
}) {
  if (!songs.length) {
    return (
      <div className="rounded-[1.6rem] border border-dashed border-[rgb(var(--border))] bg-[rgb(var(--paper-100)/0.54)] p-8 text-center">
        <Disc3 className="mx-auto h-6 w-6 text-rosewood" />
        <p className="mt-5 font-display text-3xl text-ink-900">No pulse has been placed yet.</p>
        <p className="mx-auto mt-4 max-w-md leading-7 text-ink-500">Paste a Spotify link or upload a song that remembers.</p>
      </div>
    );
  }

  return (
    <div className="grid gap-3 xl:grid-cols-2" aria-label="Songs on this tape">
      {songs.map((song, index) => (
        <article key={song.clientId} className={`button-lift rounded-[1.2rem] border p-4 ${index === activeSong ? "border-rosewood bg-rosewood/8" : "border-[rgb(var(--border))] bg-[rgb(var(--paper-100)/0.6)]"}`}>
          <div className="grid gap-3 md:grid-cols-[1fr_auto] md:items-start">
            <button type="button" onClick={() => onSelect(index)} className="min-w-0 text-left">
              <p className={typographyTokens.caption}>{String(index + 1).padStart(2, "0")} / {song.type}</p>
              <h4 className="mt-2 break-words text-xl font-medium text-ink-900">{song.title}</h4>
            </button>
            <div className="flex flex-wrap gap-2 md:justify-end">
              <IconButton aria-label="Move song up" onClick={() => onMove(index, -1)} disabled={index === 0} className="disabled:opacity-35"><ArrowUp className="h-4 w-4" /></IconButton>
              <IconButton aria-label="Move song down" onClick={() => onMove(index, 1)} disabled={index === songs.length - 1} className="disabled:opacity-35"><ArrowDown className="h-4 w-4" /></IconButton>
              <button type="button" onClick={() => onRemove(song.clientId)} className="button-lift touch-target inline-flex items-center justify-center gap-2 rounded-full border border-oxblood/30 px-3 text-sm text-oxblood hover:bg-oxblood/10">
                <Trash2 className="icon-svg h-4 w-4" /> Remove Song
              </button>
            </div>
          </div>
          <label className="mt-3 block">
            <span className="mb-2 block text-sm text-ink-500">Add Memory / Add Note</span>
            <textarea
              value={song.memory}
              onChange={(e) => onUpdate(song.clientId, { memory: e.target.value })}
              rows={2}
              placeholder="Where does this song still live?"
              className="journal-field w-full resize-none rounded-[1rem] border px-4 py-3 text-base leading-6 text-ink-800"
            />
          </label>
        </article>
      ))}
    </div>
  );
}
