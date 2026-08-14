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
import { ChangeEvent, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { BrandLogo } from "@/components/brand-logo";
import { EndingFooter } from "@/components/ending-footer";
import { ExternalMediaEmbed } from "@/components/external-media-embed";
import { LocalAudioPlayer } from "@/components/local-audio-player";
import { ReceiverExperience } from "@/components/receiver-experience";
import { Reel } from "@/components/reel";
import { IconButton } from "@/components/ui/button";
import { HeroTitle, SectionTitle } from "@/components/ui/typography";
import { clientConfig } from "@/lib/config";
import { motionTokens, typographyTokens } from "@/lib/design-tokens";
import {
  buildManagementUrl,
  buildShareUrl,
  createTape,
  deleteTape,
  extractSpotifyTrackId,
  extractYouTubeVideoId,
  newClientId,
  rituals,
  updateTape,
  validateAudioFile,
  type ComposerDraft,
  type ComposerSong,
  type SavedTape
} from "@/lib/mustape";

const emptyDraft: ComposerDraft = {
  recipient: "",
  title: "",
  inscription: "",
  senderNote: "",
  songs: []
};

export function MusTapeApp() {
  const [draft, setDraft] = useState<ComposerDraft>(emptyDraft);
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [spotifyUrl, setSpotifyUrl] = useState("");
  const [localTitle, setLocalTitle] = useState("");
  const [localArtist, setLocalArtist] = useState("");
  const [localFile, setLocalFile] = useState<File | null>(null);
  const [activeSong, setActiveSong] = useState(0);
  const [previewOpen, setPreviewOpen] = useState(true);
  const [receiverPreviewOpen, setReceiverPreviewOpen] = useState(false);
  const [reelsActive, setReelsActive] = useState(false);
  const [error, setError] = useState("");
  const [shareLink, setShareLink] = useState("");
  const [savedShareId, setSavedShareId] = useState("");
  // Management token is kept in state so it survives in the
  // management page URL — the sender is given the full /manage/:token URL.
  const [savedManagementToken, setSavedManagementToken] = useState("");
  const [copied, setCopied] = useState(false);
  const [copiedManagement, setCopiedManagement] = useState(false);
  const [isSealing, setIsSealing] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const shouldReduceMotion = useReducedMotion();

  // ─── Fix 4: Blob URL lifecycle ────────────────────────────────────────────
  // One blob URL per local song, keyed by stable clientId.
  // Created when a local song is added, revoked when it is removed or on unmount.
  const blobUrlMap = useRef<Map<string, string>>(new Map());

  /** Create a blob URL for a local song if one doesn't exist yet. */
  const getOrCreateBlobUrl = useCallback((song: ComposerSong & { type: "local" }): string => {
    const existing = blobUrlMap.current.get(song.clientId);
    if (existing) return existing;
    const url = URL.createObjectURL(song.file);
    blobUrlMap.current.set(song.clientId, url);
    return url;
  }, []);

  /** Revoke and remove a blob URL by clientId. */
  const revokeBlobUrl = useCallback((clientId: string) => {
    const url = blobUrlMap.current.get(clientId);
    if (url) {
      URL.revokeObjectURL(url);
      blobUrlMap.current.delete(clientId);
    }
  }, []);

  // Revoke ALL blob URLs on component unmount.
  useEffect(() => {
    const map = blobUrlMap.current;
    return () => {
      map.forEach((url) => URL.revokeObjectURL(url));
      map.clear();
    };
  }, []);
  // ─────────────────────────────────────────────────────────────────────────

  useEffect(() => {
    const savedTheme = window.localStorage.getItem(clientConfig.themeStorageKey);
    if (savedTheme === "light" || savedTheme === "dark") {
      setTheme(savedTheme);
    }
  }, []);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    document.body.dataset.theme = theme;
    window.localStorage.setItem(clientConfig.themeStorageKey, theme);
  }, [theme]);

  const currentSong = draft.songs[activeSong];

  // Build previewTape without calling createObjectURL inside the memo.
  // Blob URLs are read from the stable blobUrlMap ref instead.
  const previewTape = useMemo<SavedTape>(() => ({
    id: "preview",
    shareId: "preview",
    title: draft.title || "Untitled tape",
    recipient: draft.recipient || "Recipient",
    inscription: draft.inscription || "A note for them will appear here when the tape is opened.",
    senderNote: draft.senderNote,
    createdAt: new Date(0).toISOString(),
    updatedAt: new Date(0).toISOString(),
    songs: draft.songs.map((song) => {
      if (song.type === "spotify") {
        return {
          id: song.clientId,
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
          id: song.clientId,
          type: "youtube",
          title: song.title,
          artist: song.artist,
          memory: song.memory,
          youtubeUrl: song.youtubeUrl,
          youtubeVideoId: song.youtubeVideoId,
          embedUrl: song.embedUrl
        };
      }

      // Local songs: read the stable blob URL from the map.
      // getOrCreateBlobUrl is stable (useCallback with no deps).
      const audioUrl = getOrCreateBlobUrl(song);
      return {
        id: song.clientId,
        type: "local",
        title: song.title,
        artist: song.artist,
        memory: song.memory,
        fileName: song.file.name,
        originalFileName: song.file.name,
        audioPath: "",
        audioUrl
      };
    })
  }), [draft, getOrCreateBlobUrl]);

  const absoluteShareLink = useMemo(() => {
    if (!shareLink) return "";
    return buildShareUrl(shareLink);
  }, [shareLink]);

  const absoluteManagementLink = useMemo(() => {
    if (!savedManagementToken) return "";
    return buildManagementUrl(savedManagementToken);
  }, [savedManagementToken]);

  function updateDraft<K extends keyof ComposerDraft>(key: K, value: ComposerDraft[K]) {
    setDraft((current) => ({ ...current, [key]: value }));
  }

  function addSpotifySong() {
    setError("");
    const trackId = extractSpotifyTrackId(spotifyUrl);
    const youtubeVideoId = extractYouTubeVideoId(spotifyUrl);
    let song: ComposerSong;

    if (trackId) {
      song = {
        clientId: newClientId(),
        type: "spotify",
        title: "Spotify Track",
        artist: "",
        memory: "",
        spotifyUrl: spotifyUrl.trim(),
        spotifyTrackId: trackId,
        embedUrl: `https://open.spotify.com/embed/track/${trackId}`
      };
    } else if (youtubeVideoId) {
      song = {
        clientId: newClientId(),
        type: "youtube",
        title: "YouTube Track",
        artist: "",
        memory: "",
        youtubeUrl: spotifyUrl.trim(),
        youtubeVideoId,
        embedUrl: `https://www.youtube.com/embed/${youtubeVideoId}`
      };
    } else {
      setError("Paste a valid Spotify track link, Spotify URI, or YouTube link before placing it on the tape.");
      return;
    }

    setDraft((current) => ({ ...current, songs: [...current.songs, song] }));
    setActiveSong(draft.songs.length);
    setSpotifyUrl("");
  }

  function onChooseLocalFile(event: ChangeEvent<HTMLInputElement>) {
    setError("");
    const file = event.target.files?.[0];
    if (!file) return;
    if (!validateAudioFile(file)) {
      setError("Only mp3, wav, m4a, and ogg songs can be uploaded.");
      event.target.value = "";
      return;
    }
    setLocalFile(file);
    if (!localTitle) {
      setLocalTitle(file.name.replace(/\.[^/.]+$/, ""));
    }
  }

  function addLocalSong() {
    setError("");
    if (!localFile) {
      setError("Choose a song file before placing it on the tape.");
      return;
    }
    if (!localTitle.trim()) {
      setError("Give the local song a name before placing it on the tape.");
      return;
    }

    const song: ComposerSong = {
      clientId: newClientId(),
      type: "local",
      title: localTitle.trim(),
      artist: localArtist.trim(),
      memory: "",
      file: localFile
    };

    // Eagerly create the blob URL so it's in the map before render.
    getOrCreateBlobUrl(song);

    setDraft((current) => ({ ...current, songs: [...current.songs, song] }));
    setActiveSong(draft.songs.length);
    setLocalFile(null);
    setLocalTitle("");
    setLocalArtist("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  function updateSong(clientId: string, patch: Partial<ComposerSong>) {
    setDraft((current) => ({
      ...current,
      songs: current.songs.map((song) => (song.clientId === clientId ? ({ ...song, ...patch } as ComposerSong) : song))
    }));
  }

  function removeSong(clientId: string) {
    // Revoke blob URL when a local song is removed (Fix 4).
    revokeBlobUrl(clientId);
    setDraft((current) => {
      const nextSongs = current.songs.filter((song) => song.clientId !== clientId);
      setActiveSong((index) => Math.max(0, Math.min(index, nextSongs.length - 1)));
      return { ...current, songs: nextSongs };
    });
  }

  function moveSong(index: number, direction: -1 | 1) {
    setDraft((current) => {
      const target = index + direction;
      if (target < 0 || target >= current.songs.length) return current;
      const songs = [...current.songs];
      [songs[index], songs[target]] = [songs[target], songs[index]];
      setActiveSong(target);
      return { ...current, songs };
    });
  }

  function validateDraft() {
    if (!draft.recipient.trim()) return "Add the recipient before sealing the tape.";
    if (!draft.title.trim()) return "Give this memory a title before sealing it.";
    if (!draft.inscription.trim()) return "Write a note for them before sealing the tape.";
    if (!draft.songs.length) return "No pulse has been placed yet.";
    return "";
  }

  async function sealTape() {
    setError("");
    setCopied(false);
    const message = validateDraft();
    if (message) {
      setError(message);
      return;
    }

    setIsSealing(true);
    try {
      if (savedShareId && savedManagementToken) {
        // Update existing tape — passes management token for auth
        const result = await updateTape(savedShareId, savedManagementToken, draft);
        setSavedShareId(result.tape.shareId);
        setShareLink(result.shareUrl);
      } else {
        // Create new tape — receive management token once
        const result = await createTape(draft);
        setSavedShareId(result.tape.shareId);
        setSavedManagementToken(result.managementToken);
        setShareLink(result.shareUrl);
      }
      setPreviewOpen(true);
    } catch (sealError) {
      setError(sealError instanceof Error ? sealError.message : "The tape could not be sealed.");
    } finally {
      setIsSealing(false);
    }
  }

  async function handleDelete() {
    if (!deleteConfirm) {
      setDeleteConfirm(true);
      return;
    }
    if (!savedShareId || !savedManagementToken) return;
    setIsDeleting(true);
    setError("");
    try {
      await deleteTape(savedShareId, savedManagementToken);
      // Reset to clean slate after deletion
      setSavedShareId("");
      setSavedManagementToken("");
      setShareLink("");
      setDraft(emptyDraft);
      setDeleteConfirm(false);
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : "The tape could not be deleted.");
      setDeleteConfirm(false);
    } finally {
      setIsDeleting(false);
    }
  }

  async function copyShareLink() {
    if (!absoluteShareLink) {
      setError("Seal the tape first, then the private link can be copied.");
      return;
    }

    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(absoluteShareLink);
      } else {
        const textArea = document.createElement("textarea");
        textArea.value = absoluteShareLink;
        textArea.setAttribute("readonly", "");
        textArea.style.position = "fixed";
        textArea.style.opacity = "0";
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand("copy");
        document.body.removeChild(textArea);
      }
      setCopied(true);
      setError("");
    } catch {
      setError("The link is ready, but your browser would not copy it automatically.");
    }
  }

  async function copyManagementLink() {
    if (!absoluteManagementLink) return;
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(absoluteManagementLink);
      } else {
        const textArea = document.createElement("textarea");
        textArea.value = absoluteManagementLink;
        textArea.setAttribute("readonly", "");
        textArea.style.position = "fixed";
        textArea.style.opacity = "0";
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand("copy");
        document.body.removeChild(textArea);
      }
      setCopiedManagement(true);
    } catch {
      // ignore
    }
  }

  function openPreview() {
    const message = validateDraft();
    if (message) {
      setError(message);
      return;
    }
    setError("");
    setReceiverPreviewOpen(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  if (receiverPreviewOpen) {
    return <ReceiverExperience tape={previewTape} preview onReturn={() => setReceiverPreviewOpen(false)} />;
  }

  return (
    <main data-theme={theme} className="min-h-screen w-full overflow-x-hidden text-ink-800">
      <section className="paper-grain cinematic-room min-h-[112vh] px-5 py-6 sm:px-8 sm:py-7 lg:px-10">
        <div className="mx-auto flex min-h-[calc(112vh-3rem)] w-full max-w-[84rem] flex-col">
          <header className="relative z-10 flex items-center justify-between gap-4">
            <BrandLogo />

            <nav aria-label="Primary" className="hidden items-center gap-8 text-sm text-ink-500 md:flex">
              <a className="rounded-full px-1 py-2 transition hover:text-ink-900" href="#compose">Compose</a>
              <a className="rounded-full px-1 py-2 transition hover:text-ink-900" href="#ritual">Ritual</a>
              <a className="rounded-full px-1 py-2 transition hover:text-ink-900" href="#seal">Seal</a>
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
                onClick={sealTape}
                disabled={isSealing}
                className="button-lift touch-target inline-flex items-center gap-2 rounded-full bg-ink-900 px-5 text-sm text-paper-100 hover:bg-rosewood disabled:cursor-not-allowed disabled:opacity-60"
              >
                <Share2 className="icon-svg h-4 w-4" />
                <span className="hidden sm:inline">{isSealing ? "Saving" : savedShareId ? "Save tape" : "Seal tape"}</span>
              </button>
            </div>
          </header>

          <div className="relative z-10 grid flex-1 items-center gap-14 py-16 lg:grid-cols-[0.86fr_1.14fr] lg:py-10">
            <section className="max-w-xl" aria-labelledby="studio-title">
              <motion.p
                initial={shouldReduceMotion ? false : { opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: motionTokens.durations.calm, ease: "easeOut" }}
                className="mb-6 inline-flex items-center gap-2 rounded-full border border-[rgb(var(--border))] bg-[rgb(var(--surface)/0.58)] px-3 py-2 text-xs uppercase tracking-[0.18em] text-ink-500"
              >
                <Sparkles className="h-3.5 w-3.5" />
                A keepsake for sound
              </motion.p>
              <HeroTitle
                as={motion.h1}
                id="studio-title"
                initial={shouldReduceMotion ? false : { opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.08, duration: motionTokens.durations.reveal, ease: "easeOut" }}
              >
                Make a tape that feels held.
              </HeroTitle>
              <motion.p
                initial={shouldReduceMotion ? false : { opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.16, duration: motionTokens.durations.reveal, ease: "easeOut" }}
                className="mt-8 max-w-xl text-[1.15rem] leading-9 text-ink-500"
              >
                Compose a private cassette letter with songs, traces, and a link that opens like an envelope.
              </motion.p>
              <div className="mt-11 flex flex-col gap-3 sm:flex-row">
                <a href="#compose" className="button-lift touch-target inline-flex items-center justify-center gap-3 rounded-full bg-rosewood px-6 text-sm font-medium text-paper-100 hover:bg-ink-900">
                  Begin the letter
                  <ArrowRight className="icon-svg h-4 w-4" />
                </a>
                <button
                  type="button"
                  onClick={openPreview}
                  className="button-lift touch-target inline-flex items-center justify-center rounded-full border border-[rgb(var(--border))] bg-[rgb(var(--surface)/0.52)] px-6 text-sm font-medium text-ink-700 hover:border-brass hover:text-ink-900"
                >
                  Preview
                </button>
              </div>
            </section>

            <TapePreview
              draft={draft}
              currentSong={currentSong}
              activeSong={activeSong}
              previewOpen={previewOpen}
              reelsActive={reelsActive}
              blobUrlMap={blobUrlMap.current}
              onPlayingChange={setReelsActive}
              onPrevious={() => setActiveSong((index) => (index <= 0 ? Math.max(0, draft.songs.length - 1) : index - 1))}
              onNext={() => setActiveSong((index) => (index + 1 >= draft.songs.length ? 0 : index + 1))}
            />
          </div>
        </div>
      </section>

      <section id="compose" className="relative bg-[rgb(var(--surface))] px-5 py-28 sm:px-8 lg:px-10">
        <div className="mx-auto max-w-[84rem]">
          <div className="grid gap-14 lg:grid-cols-[0.76fr_1.24fr]">
          <div>
            <p className="text-sm uppercase tracking-[0.18em] text-ink-400">Composition desk</p>
            <SectionTitle className="mt-5 max-w-md">
              Place only what deserves to be remembered.
            </SectionTitle>
            <p className="mt-7 max-w-md text-[1.05rem] leading-8 text-ink-500">
              No default songs. No borrowed mood. Paste a Spotify link or upload the sound that belongs here.
            </p>
          </div>

          <div className="grid gap-7">
            <div className="grid gap-6">
              <Field label="Recipient" value={draft.recipient} placeholder="Who is this for?" onChange={(value) => updateDraft("recipient", value)} />
              <Field label="Tape title" value={draft.title} placeholder="The night we kept driving" onChange={(value) => updateDraft("title", value)} />
              <label className="block">
                <span className="mb-2 block text-sm text-ink-500">A Note for Them</span>
                <textarea
                  value={draft.inscription}
                  onChange={(event) => updateDraft("inscription", event.target.value)}
                  rows={4}
                  placeholder="Write the line that opens the tape."
                  className="journal-field w-full resize-none rounded-[1.35rem] border px-6 py-5 text-lg leading-8 text-ink-800"
                />
              </label>
              <Field label="Sender note" value={draft.senderNote} placeholder="Optional closing trace" onChange={(value) => updateDraft("senderNote", value)} />
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
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".mp3,.wav,.m4a,.ogg,audio/*"
                    onChange={onChooseLocalFile}
                    className="journal-field min-h-[3.875rem] w-full rounded-full border px-5 py-3 text-sm text-ink-600 file:mr-4 file:rounded-full file:border-0 file:bg-rosewood file:px-4 file:py-2 file:text-sm file:text-paper-100"
                  />
                  <input
                    value={localTitle}
                    onChange={(event) => setLocalTitle(event.target.value)}
                    placeholder="Custom song name"
                    className="journal-field w-full rounded-full border px-6 text-base text-ink-800"
                  />
                  <input
                    value={localArtist}
                    onChange={(event) => setLocalArtist(event.target.value)}
                    placeholder="Artist, if remembered"
                    className="journal-field w-full rounded-full border px-6 text-base text-ink-800"
                  />
                  <button type="button" onClick={addLocalSong} className="button-lift touch-target inline-flex w-full items-center justify-center gap-2 rounded-full bg-ink-900 px-5 text-sm text-paper-100 hover:bg-rosewood">
                    <FileAudio className="icon-svg h-4 w-4" />
                    Upload Local Song
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
                  <input
                    value={spotifyUrl}
                    onChange={(event) => setSpotifyUrl(event.target.value)}
                    placeholder="Spotify track link, spotify:track:..., or YouTube link"
                    className="journal-field w-full rounded-full border px-6 text-base text-ink-800"
                  />
                  <button type="button" onClick={addSpotifySong} className="button-lift touch-target inline-flex w-full items-center justify-center gap-2 rounded-full bg-ink-900 px-5 text-sm text-paper-100 hover:bg-rosewood">
                    <Plus className="icon-svg h-4 w-4" />
                    Add Spotify Song
                  </button>
                </div>
              </div>
            </div>

            <SongList
              songs={draft.songs}
              activeSong={activeSong}
              onSelect={setActiveSong}
              onMove={moveSong}
              onRemove={removeSong}
              onUpdate={updateSong}
            />

            {/* ── Seal section ─────────────────────────────────────── */}
            <div id="seal" className="grid gap-4 rounded-[1.35rem] border border-[rgb(var(--border))] bg-[rgb(var(--paper-100)/0.72)] p-5 shadow-insetpaper">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h3 className="font-display text-3xl text-ink-900">Seal Tape</h3>
                  <p className="mt-2 text-sm text-ink-500">
                    {savedShareId ? "Save changes to the same private link." : "When the order feels inevitable, turn it into a private link."}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={sealTape}
                    disabled={isSealing}
                    className="button-lift touch-target inline-flex items-center justify-center gap-2 rounded-full bg-rosewood px-6 text-sm text-paper-100 hover:bg-ink-900 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <Share2 className="icon-svg h-4 w-4" />
                    {isSealing ? "Saving" : savedShareId ? "Save Tape" : "Seal Tape"}
                  </button>
                  {savedShareId && savedManagementToken ? (
                    <button
                      type="button"
                      onClick={handleDelete}
                      disabled={isDeleting}
                      className={`button-lift touch-target inline-flex items-center justify-center gap-2 rounded-full border px-4 text-sm disabled:cursor-not-allowed disabled:opacity-60 ${
                        deleteConfirm
                          ? "border-oxblood bg-oxblood text-paper-100 hover:bg-oxblood/80"
                          : "border-oxblood/30 text-oxblood hover:bg-oxblood/10"
                      }`}
                    >
                      <Trash2 className="icon-svg h-4 w-4" />
                      {isDeleting ? "Deleting…" : deleteConfirm ? "Confirm Delete" : "Delete Tape"}
                    </button>
                  ) : null}
                </div>
              </div>
              {deleteConfirm && !isDeleting ? (
                <p className="rounded-[1rem] bg-oxblood/10 px-4 py-3 text-sm text-oxblood">
                  This will permanently destroy the tape and all its uploaded audio.{" "}
                  <button type="button" onClick={() => setDeleteConfirm(false)} className="underline hover:no-underline">
                    Cancel
                  </button>
                </p>
              ) : null}
              {error ? <p role="alert" className="rounded-[1rem] bg-oxblood/10 px-4 py-3 text-sm text-oxblood">{error}</p> : null}

              {/* Receiver link */}
              {shareLink ? (
                <div className="grid gap-3">
                  <p className="text-xs uppercase tracking-[0.18em] text-ink-400">Receiver link — share this with the recipient</p>
                  <div className="grid gap-3 rounded-[1.2rem] border border-brass/40 bg-brass/10 p-4 sm:grid-cols-[1fr_auto_auto] sm:items-center">
                    <p className="break-all text-sm text-ink-700">{absoluteShareLink}</p>
                    <button type="button" onClick={copyShareLink} className="button-lift touch-target inline-flex items-center justify-center gap-2 rounded-full border border-[rgb(var(--border))] bg-[rgb(var(--surface))] px-4 text-sm text-ink-700 hover:border-brass">
                      <Copy className="icon-svg h-4 w-4" />
                      {copied ? "Copied" : "Copy Link"}
                    </button>
                    <a href={absoluteShareLink} className="button-lift touch-target inline-flex items-center justify-center gap-2 rounded-full bg-ink-900 px-4 text-sm text-paper-100 hover:bg-rosewood">
                      <ExternalLink className="icon-svg h-4 w-4" />
                      Open Tape
                    </a>
                  </div>

                  {/* Management link — shown only to the sender, immediately after creation */}
                  {absoluteManagementLink ? (
                    <div className="grid gap-3 rounded-[1.2rem] border border-rosewood/30 bg-rosewood/6 p-4 sm:grid-cols-[1fr_auto] sm:items-center">
                      <div>
                        <p className="mb-1 text-xs uppercase tracking-[0.18em] text-rosewood/70">Management link — save this privately to edit or delete</p>
                        <p className="break-all text-sm text-ink-700">{absoluteManagementLink}</p>
                      </div>
                      <button type="button" onClick={copyManagementLink} className="button-lift touch-target inline-flex items-center justify-center gap-2 rounded-full border border-rosewood/30 bg-[rgb(var(--surface))] px-4 text-sm text-rosewood hover:border-rosewood">
                        <Copy className="icon-svg h-4 w-4" />
                        {copiedManagement ? "Copied" : "Copy"}
                      </button>
                    </div>
                  ) : null}
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </section>

      <section id="ritual" className="px-5 py-32 sm:px-8 lg:px-10">
        <div className="mx-auto max-w-[84rem]">
          <div className="max-w-2xl">
            <p className="text-sm uppercase tracking-[0.18em] text-ink-400">The ritual</p>
            <SectionTitle className="mt-5">Three gestures. No machinery showing.</SectionTitle>
          </div>
          <div className="mt-14 grid gap-5 md:grid-cols-3">
            {rituals.map((ritual, index) => {
              const Icon = ritual.icon;
              return (
                <motion.article
                  key={ritual.title}
                  initial={shouldReduceMotion ? false : { opacity: 0, y: 18 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-80px" }}
                  transition={{ delay: index * 0.08, duration: motionTokens.durations.calm, ease: "easeOut" }}
                  className="button-lift rounded-[1.6rem] border border-[rgb(var(--border))] bg-[rgb(var(--surface)/0.64)] p-8 shadow-insetpaper"
                >
                  <Icon className="h-5 w-5 text-rosewood" />
                  <h3 className="mt-8 font-display text-3xl text-ink-900">{ritual.title}</h3>
                  <p className="mt-4 leading-7 text-ink-500">{ritual.text}</p>
                </motion.article>
              );
            })}
          </div>
        </div>
      </section>

      <EndingFooter />
    </main>
  );
}

function Field({
  label,
  value,
  placeholder,
  onChange
}: {
  label: string;
  value: string;
  placeholder: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm text-ink-500">{label}</span>
      <input
        value={value}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
        className="journal-field w-full rounded-full border px-6 text-lg text-ink-800"
      />
    </label>
  );
}

function TapePreview({
  draft,
  currentSong,
  activeSong,
  previewOpen,
  reelsActive,
  blobUrlMap,
  onPlayingChange,
  onPrevious,
  onNext
}: {
  draft: ComposerDraft;
  currentSong?: ComposerSong;
  activeSong: number;
  previewOpen: boolean;
  reelsActive: boolean;
  blobUrlMap: Map<string, string>;
  onPlayingChange: (isPlaying: boolean) => void;
  onPrevious: () => void;
  onNext: () => void;
}) {
  const shouldReduceMotion = useReducedMotion();
  const visualReelsActive = reelsActive || Boolean(currentSong && currentSong.type !== "local");

  // Read the blob URL from the map — never call createObjectURL in render.
  const localSrc = currentSong?.type === "local" ? blobUrlMap.get(currentSong.clientId) ?? "" : "";

  return (
    <motion.section
      aria-label="Tape preview"
      initial={{ opacity: 0, scale: 0.97, y: 18 }}
      animate={{
        opacity: previewOpen ? 1 : 0.76,
        scale: 1,
        y: shouldReduceMotion ? 0 : [0, -4, 0]
      }}
      transition={{
        opacity: { duration: motionTokens.durations.object, ease: motionTokens.gentleEase },
        scale: { duration: motionTokens.durations.object, ease: motionTokens.gentleEase },
        y: { duration: motionTokens.durations.drift, repeat: Infinity, ease: "easeInOut" }
      }}
      className="relative mx-auto w-full max-w-2xl"
    >
      <div className="absolute -left-6 top-12 hidden h-48 w-10 rounded-l-[2rem] bg-rosewood/80 lg:block" aria-hidden />
      <Image
        src="/images/memory-strip.png"
        alt="A small archival strip of music memories"
        width={360}
        height={520}
        priority
        className="absolute -bottom-12 -right-9 z-0 hidden w-36 rotate-3 rounded-[1rem] border border-[rgb(var(--border))] object-cover shadow-object lg:block"
      />
      <div className="relative z-10 rounded-[2rem] border border-[rgb(var(--border))] bg-[rgb(var(--surface))] p-5 shadow-object shadow-insetpaper sm:p-7">
        <div className="rounded-[1.45rem] border border-[rgb(var(--border))] bg-[rgb(var(--paper-100))] p-5">
          <div className="flex items-start justify-between gap-4 border-b border-[rgb(var(--border))] pb-5">
            <div className="min-w-0">
              <p className={typographyTokens.caption}>Side A / {String(activeSong + 1).padStart(2, "0")}</p>
              <h2 className="mt-3 break-words font-display text-4xl leading-none text-ink-900">{draft.recipient || "Recipient"}</h2>
            </div>
            <span className="shrink-0 rounded-full bg-brass/15 px-3 py-1 text-xs text-ink-600">Draft</span>
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
                    <p className={typographyTokens.caption}>
                      {currentSong.type === "spotify" ? "Spotify trace" : currentSong.type === "youtube" ? "YouTube trace" : "Local trace"}
                    </p>
                    <h3 className="mt-2 break-words text-2xl font-medium text-ink-900">{currentSong.title}</h3>
                    {currentSong.artist ? <p className="mt-1 break-words text-sm text-ink-500">{currentSong.artist}</p> : null}
                    <p className="mt-5 max-w-md break-words text-lg leading-8 text-ink-600">{currentSong.memory || "Add Memory / Add Note beside this song."}</p>
                    {currentSong.type === "local" ? (
                      <div className="mt-5">
                        {localSrc ? (
                          <LocalAudioPlayer src={localSrc} title={currentSong.title} onPlayingChange={onPlayingChange} />
                        ) : null}
                      </div>
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
              <IconButton aria-label="Back" onClick={onPrevious} disabled={!draft.songs.length}>
                <ChevronLeft className="h-4 w-4" />
              </IconButton>
              <IconButton aria-label="Next song" onClick={onNext} disabled={!draft.songs.length}>
                <ArrowRight className="h-4 w-4" />
              </IconButton>
            </div>
            <a href="#compose" className="button-lift touch-target inline-flex items-center justify-center gap-2 rounded-full bg-[rgb(var(--paper-100))] px-4 text-sm text-ink-700 hover:text-ink-900">
              <Plus className="icon-svg h-4 w-4" />
              Add Memory / Add Note
            </a>
          </div>
        </div>

        <div className="mt-5 flex items-center justify-between gap-3 px-2 text-sm text-ink-500">
          <span className="min-w-0 break-words">{draft.title || "Untitled tape"}</span>
          <span className="inline-flex shrink-0 items-center gap-2">
            <Check className="h-4 w-4 text-moss" />
            {draft.songs.length} {draft.songs.length === 1 ? "trace" : "traces"}
          </span>
        </div>
      </div>
    </motion.section>
  );
}

function SongList({
  songs,
  activeSong,
  onSelect,
  onMove,
  onRemove,
  onUpdate
}: {
  songs: ComposerSong[];
  activeSong: number;
  onSelect: (index: number) => void;
  onMove: (index: number, direction: -1 | 1) => void;
  onRemove: (clientId: string) => void;
  onUpdate: (clientId: string, patch: Partial<ComposerSong>) => void;
}) {
  if (!songs.length) {
    return (
      <div className="rounded-[1.6rem] border border-dashed border-[rgb(var(--border))] bg-[rgb(var(--paper-100)/0.54)] p-8 text-center">
        <Disc3 className="mx-auto h-6 w-6 text-rosewood" />
        <p className="mt-5 font-display text-3xl text-ink-900">No pulse has been placed yet.</p>
        <p className="mx-auto mt-4 max-w-md leading-7 text-ink-500">Paste a Spotify link or upload a song that remembers. The tape waits quietly until the first sound arrives.</p>
      </div>
    );
  }

  return (
    <div className="grid gap-3 xl:grid-cols-2" aria-label="Songs on this tape">
      {songs.map((song, index) => (
        <article
          key={song.clientId}
          className={`button-lift rounded-[1.2rem] border p-4 ${
            index === activeSong
              ? "border-rosewood bg-rosewood/8"
              : "border-[rgb(var(--border))] bg-[rgb(var(--paper-100)/0.6)]"
          }`}
        >
          <div className="grid gap-3 md:grid-cols-[1fr_auto] md:items-start">
            <button type="button" onClick={() => onSelect(index)} className="min-w-0 text-left">
              <p className={typographyTokens.caption}>{String(index + 1).padStart(2, "0")} / {song.type}</p>
              <h4 className="mt-2 break-words text-xl font-medium text-ink-900">{song.title}</h4>
            </button>
            <div className="flex flex-wrap gap-2 md:justify-end">
              <IconButton aria-label="Move song up" onClick={() => onMove(index, -1)} disabled={index === 0} className="disabled:opacity-35">
                <ArrowUp className="h-4 w-4" />
              </IconButton>
              <IconButton aria-label="Move song down" onClick={() => onMove(index, 1)} disabled={index === songs.length - 1} className="disabled:opacity-35">
                <ArrowDown className="h-4 w-4" />
              </IconButton>
              <button type="button" onClick={() => onRemove(song.clientId)} className="button-lift touch-target inline-flex items-center justify-center gap-2 rounded-full border border-oxblood/30 px-3 text-sm text-oxblood hover:bg-oxblood/10">
                <Trash2 className="icon-svg h-4 w-4" />
                Remove Song
              </button>
            </div>
          </div>
          <label className="mt-3 block">
            <span className="mb-2 block text-sm text-ink-500">Add Memory / Add Note</span>
            <textarea
              value={song.memory}
              onChange={(event) => onUpdate(song.clientId, { memory: event.target.value })}
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
