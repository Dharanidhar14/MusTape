import { Archive, CassetteTape, Feather } from "lucide-react";

export type SavedSong =
  | {
      id: string;
      type: "spotify";
      title: string;
      artist: string;
      memory: string;
      spotifyUrl: string;
      spotifyTrackId: string;
      embedUrl: string;
    }
  | {
      id: string;
      type: "local";
      title: string;
      artist: string;
      memory: string;
      originalFileName: string;
      fileName: string;
      audioUrl: string;
      audioPath: string;
    };

export type SavedTape = {
  id: string;
  shareId: string;
  title: string;
  recipient: string;
  inscription: string;
  senderNote: string;
  songs: SavedSong[];
  createdAt: string;
  updatedAt: string;
};

export type ComposerSong =
  | {
      clientId: string;
      type: "spotify";
      title: string;
      artist: string;
      memory: string;
      spotifyUrl: string;
      spotifyTrackId: string;
      embedUrl: string;
    }
  | {
      clientId: string;
      type: "local";
      title: string;
      artist: string;
      memory: string;
      file: File;
    };

export type ComposerDraft = {
  recipient: string;
  title: string;
  inscription: string;
  senderNote: string;
  songs: ComposerSong[];
};

export const apiBaseUrl =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") || "http://localhost:5000";

export const appBaseUrl = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "");

export const rituals = [
  {
    title: "Compose",
    text: "Place the songs in the order the memory wants to be opened.",
    icon: CassetteTape
  },
  {
    title: "Trace",
    text: "Leave a note beside each pulse so the listener knows where it lived.",
    icon: Feather
  },
  {
    title: "Seal",
    text: "The tape becomes a private link, quiet enough to feel like an envelope.",
    icon: Archive
  }
];

export function newClientId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export function extractSpotifyTrackId(input: string) {
  try {
    const url = new URL(input.trim());
    if (url.hostname !== "open.spotify.com") return null;
    const [kind, trackId] = url.pathname.split("/").filter(Boolean);
    if (kind !== "track" || !trackId) return null;
    return /^[A-Za-z0-9]{16,32}$/.test(trackId) ? trackId : null;
  } catch {
    return null;
  }
}

export function validateAudioFile(file: File) {
  const allowedTypes = new Set([
    "audio/mpeg",
    "audio/mp3",
    "audio/wav",
    "audio/x-wav",
    "audio/mp4",
    "audio/m4a",
    "audio/aac",
    "audio/ogg"
  ]);
  const allowedExtensions = [".mp3", ".wav", ".m4a", ".ogg"];
  const lowerName = file.name.toLowerCase();

  return allowedTypes.has(file.type) || allowedExtensions.some((extension) => lowerName.endsWith(extension));
}

export async function createTape(draft: ComposerDraft) {
  const formData = new FormData();
  const localFiles: File[] = [];

  const songs = draft.songs.map((song) => {
    if (song.type === "spotify") {
      return {
        type: "spotify",
        title: song.title,
        artist: song.artist,
        memory: song.memory,
        spotifyUrl: song.spotifyUrl
      };
    }

    const localFileIndex = localFiles.length;
    localFiles.push(song.file);
    return {
      type: "local",
      title: song.title,
      artist: song.artist,
      memory: song.memory,
      localFileIndex
    };
  });

  localFiles.forEach((file) => formData.append("localFiles", file));
  formData.append(
    "tape",
    JSON.stringify({
      recipient: draft.recipient,
      title: draft.title,
      inscription: draft.inscription,
      senderNote: draft.senderNote,
      songs
    })
  );

  let response: Response;
  try {
    response = await fetch(`${apiBaseUrl}/api/tapes`, {
      method: "POST",
      body: formData
    });
  } catch {
    throw new Error(`MusTape could not reach the API at ${apiBaseUrl}. Start the backend or check NEXT_PUBLIC_API_URL.`);
  }

  const body = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(body?.error || "The tape could not be sealed.");
  }

  return body as { tape: SavedTape; shareUrl: string };
}

export async function fetchTape(shareId: string) {
  let response: Response;
  try {
    response = await fetch(`${apiBaseUrl}/api/tapes/${encodeURIComponent(shareId)}`, {
      cache: "no-store"
    });
  } catch {
    throw new Error(`MusTape could not reach the API at ${apiBaseUrl}. Start the backend or check NEXT_PUBLIC_API_URL.`);
  }
  const body = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(body?.error || "This tape could not be opened.");
  }

  return body.tape as SavedTape;
}

export function buildShareUrl(sharePath: string) {
  if (/^https?:\/\//i.test(sharePath)) return sharePath;
  const baseUrl = appBaseUrl || (typeof window !== "undefined" ? window.location.origin : "");
  return baseUrl ? new URL(sharePath, baseUrl).toString() : sharePath;
}
