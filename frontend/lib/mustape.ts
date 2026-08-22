import { Archive, CassetteTape, Feather } from "lucide-react";
import { apiBaseUrl, appBaseUrl, clientConfig } from "@/lib/config";
import { apiUnavailableMessage, userFacingApiError } from "@/lib/errors";

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
      type: "youtube";
      title: string;
      artist: string;
      memory: string;
      youtubeUrl: string;
      youtubeVideoId: string;
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
      type: "youtube";
      title: string;
      artist: string;
      memory: string;
      youtubeUrl: string;
      youtubeVideoId: string;
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

/** Result returned from createTape — includes managementToken for building management URL */
export type CreateTapeResult = {
  tape: SavedTape;
  shareUrl: string;
  managementToken: string;
};

/** Result returned from updateTape — managementToken not re-issued */
export type UpdateTapeResult = {
  tape: SavedTape;
  shareUrl: string;
};

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
  const value = input.trim();
  const uriMatch = value.match(/^spotify:track:([A-Za-z0-9]{16,32})$/);
  if (uriMatch) return uriMatch[1];

  try {
    const url = new URL(value);
    if (url.hostname !== "open.spotify.com") return null;
    const [kind, trackId] = url.pathname.split("/").filter(Boolean);
    if (kind !== "track" || !trackId) return null;
    return /^[A-Za-z0-9]{16,32}$/.test(trackId) ? trackId : null;
  } catch {
    return null;
  }
}

export function extractYouTubeVideoId(input: string) {
  try {
    const url = new URL(input.trim());
    const host = url.hostname.replace(/^www\./, "");

    if (host === "youtu.be") {
      const [videoId] = url.pathname.split("/").filter(Boolean);
      return isYouTubeVideoId(videoId) ? videoId : null;
    }

    if (host === "youtube.com" || host === "m.youtube.com") {
      if (url.pathname === "/watch") {
        const videoId = url.searchParams.get("v");
        return isYouTubeVideoId(videoId) ? videoId : null;
      }

      const [kind, videoId] = url.pathname.split("/").filter(Boolean);
      if (kind === "embed") return isYouTubeVideoId(videoId) ? videoId : null;
    }

    return null;
  } catch {
    return null;
  }
}

function isYouTubeVideoId(value: string | null | undefined) {
  return typeof value === "string" && /^[A-Za-z0-9_-]{11}$/.test(value);
}

export function validateAudioFile(file: File) {
  const allowedTypes = new Set<string>(clientConfig.acceptedAudioMimeTypes);
  const lowerName = file.name.toLowerCase();

  return allowedTypes.has(file.type) || clientConfig.acceptedAudioExtensions.some((extension) => lowerName.endsWith(extension));
}

function tapeFormData(draft: ComposerDraft) {
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

    if (song.type === "youtube") {
      return {
        type: "youtube",
        title: song.title,
        artist: song.artist,
        memory: song.memory,
        youtubeUrl: song.youtubeUrl
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

  return formData;
}

export async function createTape(draft: ComposerDraft, collectionId?: string): Promise<CreateTapeResult> {
  let response: Response;
  try {
    const formData = tapeFormData(draft);
    if (collectionId) {
      formData.append("collectionId", collectionId);
    }
    response = await fetch(`${apiBaseUrl}/api/tapes`, {
      method: "POST",
      body: formData,
      credentials: "include"
    });
  } catch {
    throw new Error(apiUnavailableMessage(apiBaseUrl));
  }

  const body = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(userFacingApiError(body, "The tape could not be sealed."));
  }

  return body as CreateTapeResult;
}

export async function updateTape(shareId: string, managementToken: string, draft: ComposerDraft): Promise<UpdateTapeResult> {
  let response: Response;
  try {
    response = await fetch(`${apiBaseUrl}/api/tapes/${encodeURIComponent(shareId)}`, {
      method: "PUT",
      headers: {
        "X-Management-Token": managementToken
      },
      body: tapeFormData(draft),
      credentials: "include"
    });
  } catch {
    throw new Error(apiUnavailableMessage(apiBaseUrl));
  }

  const body = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(userFacingApiError(body, "The tape could not be saved."));
  }

  return body as UpdateTapeResult;
}

export async function deleteTape(shareId: string, managementToken: string): Promise<void> {
  let response: Response;
  try {
    response = await fetch(`${apiBaseUrl}/api/tapes/${encodeURIComponent(shareId)}`, {
      method: "DELETE",
      headers: {
        "X-Management-Token": managementToken
      },
      credentials: "include"
    });
  } catch {
    throw new Error(apiUnavailableMessage(apiBaseUrl));
  }

  const body = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(userFacingApiError(body, "The tape could not be deleted."));
  }
}

// ... existing code down to deleteCollection ...

export async function fetchCollectionTapes(collectionId: string): Promise<SavedTape[]> {
  const res = await fetch(`${apiBaseUrl}/api/collections/${collectionId}/tapes`, {
    credentials: "include",
    cache: "no-store"
  });
  if (!res.ok) throw new Error("Failed to load tapes");
  const data = await res.json();
  return data.tapes;
}

export async function fetchTape(shareId: string): Promise<SavedTape> {
  let response: Response;
  try {
    response = await fetch(`${apiBaseUrl}/api/tapes/${encodeURIComponent(shareId)}`, {
      cache: "no-store"
    });
  } catch {
    throw new Error(apiUnavailableMessage(apiBaseUrl));
  }
  const body = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(userFacingApiError(body, "This tape could not be opened."));
  }

  return body.tape as SavedTape;
}

/** Fetch tape data for the management page using the management token */
export async function fetchManageTape(managementToken: string): Promise<SavedTape> {
  let response: Response;
  try {
    response = await fetch(`${apiBaseUrl}/api/manage/${encodeURIComponent(managementToken)}`, {
      cache: "no-store"
    });
  } catch {
    throw new Error(apiUnavailableMessage(apiBaseUrl));
  }
  const body = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(userFacingApiError(body, "This management link could not be found."));
  }

  return body.tape as SavedTape;
}

export function buildShareUrl(sharePath: string) {
  if (/^https?:\/\//i.test(sharePath)) return sharePath;
  const baseUrl = appBaseUrl || (typeof window !== "undefined" ? window.location.origin : "");
  return baseUrl ? new URL(sharePath, baseUrl).toString() : sharePath;
}

export function buildManagementUrl(managementToken: string) {
  const baseUrl = appBaseUrl || (typeof window !== "undefined" ? window.location.origin : "");
  const path = `/manage/${managementToken}`;
  return baseUrl ? new URL(path, baseUrl).toString() : path;
}

// Auth API

export async function loginWithGoogle(credential: string) {
  const res = await fetch(`${apiBaseUrl}/api/auth/google`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ credential }),
    credentials: "include"
  });
  if (!res.ok) throw new Error("Failed to login");
  const data = await res.json();
  return data.user;
}

export async function checkAuth() {
  const res = await fetch(`${apiBaseUrl}/api/auth/me`, {
    credentials: "include"
  });
  if (!res.ok) throw new Error("Not authenticated");
  const data = await res.json();
  return data.user;
}

export async function logout() {
  await fetch(`${apiBaseUrl}/api/auth/logout`, {
    method: "POST",
    credentials: "include"
  });
}

// Collection API

export type Collection = {
  id: string;
  name: string;
  recipient_name: string;
  recipient_email: string;
  sender_name: string;
  description: string;
  created_at: string;
  updated_at: string;
};

export async function fetchCollections(): Promise<Collection[]> {
  const res = await fetch(`${apiBaseUrl}/api/collections`, {
    credentials: "include",
    cache: "no-store"
  });
  if (!res.ok) throw new Error("Failed to load collections");
  const data = await res.json();
  return data.collections;
}

export async function fetchCollection(id: string): Promise<Collection> {
  const res = await fetch(`${apiBaseUrl}/api/collections/${id}`, {
    credentials: "include",
    cache: "no-store"
  });
  if (!res.ok) throw new Error("Failed to load collection");
  const data = await res.json();
  return data.collection;
}

export async function createCollection(data: Partial<Collection>): Promise<Collection> {
  const res = await fetch(`${apiBaseUrl}/api/collections`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
    credentials: "include"
  });
  if (!res.ok) throw new Error("Failed to create collection");
  const result = await res.json();
  return result.collection;
}

export async function deleteCollection(id: string): Promise<void> {
  const res = await fetch(`${apiBaseUrl}/api/collections/${id}`, {
    method: "DELETE",
    credentials: "include"
  });
  if (!res.ok) throw new Error("Failed to delete collection");
}
