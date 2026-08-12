import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import { paths } from "../config/paths.js";
import { serverConfig } from "../config/server.js";
import { readTapes, writeTapes } from "../storage/tapeStore.js";
import { extractSpotifyTrackId, extractYouTubeVideoId, spotifyEmbedUrl, spotifyTrackMetadata, youtubeEmbedUrl } from "./spotifyService.js";
import { logger } from "./logger.js";
import { cleanText, fail } from "./textService.js";

const MAX_TEXT = 700;
const MAX_TITLE = 120;

// Returns the public tape object for receiver/API responses.
// managementToken is NEVER included here.
export function publicTape(tape, request) {
  const baseUrl = `${request.protocol}://${request.get("host")}`;
  // Destructure out managementToken so it never leaks into responses
  // eslint-disable-next-line no-unused-vars
  const { managementToken: _mt, ...safeTape } = tape;
  return {
    ...safeTape,
    songs: safeTape.songs.map((song) => {
      if (song.type === "spotify") {
        return {
          ...song,
          title: cleanSpotifyTitle(song.title)
        };
      }
      if (song.type !== "local") return song;
      return {
        ...song,
        audioUrl: `${baseUrl}${song.audioPath}`
      };
    })
  };
}

// Authenticate the management token against a tape.
// Throws 403 if the token is missing or does not match.
export function verifyManagementToken(tape, token) {
  if (!token || !tape.managementToken || token !== tape.managementToken) {
    fail("This action requires a valid management link.", 403, "MUSTAPE_UNAUTHORIZED");
  }
}

// Delete local audio files that are no longer referenced.
// Ignores ENOENT (already cleaned), logs unexpected failures.
export async function deleteLocalFiles(fileNames) {
  for (const fileName of fileNames) {
    const filePath = path.join(paths.uploadDir, fileName);
    try {
      await fs.unlink(filePath);
      logger.info("file.deleted", { fileName });
    } catch (error) {
      if (error.code === "ENOENT") {
        logger.debug("file.already_gone", { fileName });
      } else {
        // Log safely — do NOT expose filesystem paths in the error message
        logger.warn("file.delete_failed", { fileName, code: error.code });
      }
    }
  }
}

function cleanSpotifyTitle(title) {
  const value = cleanText(title, MAX_TITLE);
  return /^spotify track\s+[A-Za-z0-9]/i.test(value) ? "Spotify Track" : value || "Spotify Track";
}

async function normalizeSongs(songs, files) {
  const usedFileIndexes = new Set();

  return Promise.all(songs.map(async (song, index) => {
    const type = song.type;
    const memory = cleanText(song.memory, MAX_TEXT);
    const artist = cleanText(song.artist, MAX_TITLE);

    if (type === "spotify") {
      const spotifyUrl = cleanText(song.spotifyUrl, 300);
      const spotifyTrackId = extractSpotifyTrackId(spotifyUrl);
      if (!spotifyTrackId) fail(`Song ${index + 1} needs a valid Spotify track link.`);
      const metadata = await spotifyTrackMetadata(spotifyUrl);
      const title = cleanSpotifyTitle(song.title);
      const metadataTitle = cleanText(metadata?.title, MAX_TITLE);
      const metadataAuthor = cleanText(metadata?.author, MAX_TITLE);

      return {
        id: crypto.randomUUID(),
        type: "spotify",
        title: title !== "Spotify Track" ? title : metadataTitle || "Spotify Track",
        artist: artist || metadataAuthor,
        memory,
        spotifyUrl,
        spotifyTrackId,
        embedUrl: spotifyEmbedUrl(spotifyTrackId)
      };
    }

    if (type === "youtube") {
      const youtubeUrl = cleanText(song.youtubeUrl, 300);
      const youtubeVideoId = extractYouTubeVideoId(youtubeUrl);
      if (!youtubeVideoId) fail(`Song ${index + 1} needs a valid YouTube link.`);

      return {
        id: crypto.randomUUID(),
        type: "youtube",
        title: cleanText(song.title, MAX_TITLE) || "YouTube trace",
        artist,
        memory,
        youtubeUrl,
        youtubeVideoId,
        embedUrl: youtubeEmbedUrl(youtubeVideoId)
      };
    }

    if (type === "local") {
      const title = cleanText(song.title, MAX_TITLE);
      const fileIndex = Number(song.localFileIndex);
      const file = files[fileIndex];

      if (!title) fail(`Local song ${index + 1} needs a custom name.`);
      if (!Number.isInteger(fileIndex) || !file) fail(`Local song ${index + 1} is missing its audio file.`);
      if (usedFileIndexes.has(fileIndex)) fail("Each local upload can only be placed once.");
      usedFileIndexes.add(fileIndex);

      return {
        id: crypto.randomUUID(),
        type: "local",
        title,
        artist,
        memory,
        fileName: file.filename,
        originalFileName: file.originalname,
        audioPath: `/uploads/${file.filename}`
      };
    }

    fail(`Song ${index + 1} has an unknown source.`);
  }));
}

function parseDraft(rawTape) {
  if (!rawTape) fail("The tape arrived without its letter.");

  try {
    return JSON.parse(rawTape);
  } catch {
    fail("The tape could not be read. Please try sealing it again.");
  }
}

function validateDraftFields(draft) {
  const recipient = cleanText(draft.recipient, MAX_TITLE);
  const title = cleanText(draft.title, MAX_TITLE);
  const inscription = cleanText(draft.inscription, 1200);
  const senderNote = cleanText(draft.senderNote, 500);
  const songs = Array.isArray(draft.songs) ? draft.songs : [];

  if (!recipient) fail("Add the recipient before sealing the tape.");
  if (!title) fail("Give the tape a title before sealing it.");
  if (!inscription) fail("Leave a note before sealing the tape.");
  if (!songs.length) fail("A tape needs at least one song before it can be sealed.");
  if (songs.length > serverConfig.maxSongs) fail(`This tape is too full. Keep it under ${serverConfig.maxSongs} songs.`);

  return { recipient, title, inscription, senderNote, songs };
}

// Collect the set of local audio filenames referenced by a tape's songs.
function localFileNamesFromSongs(songs) {
  return new Set(
    songs
      .filter((s) => s.type === "local" && s.fileName)
      .map((s) => s.fileName)
  );
}

export async function createTapeFromDraft(rawTape, files = []) {
  const draft = parseDraft(rawTape);
  const { recipient, title, inscription, senderNote, songs } = validateDraftFields(draft);
  const tapes = await readTapes();
  let shareId = crypto.randomBytes(5).toString("base64url");
  while (tapes.some((tape) => tape.shareId === shareId)) {
    shareId = crypto.randomBytes(5).toString("base64url");
  }
  logger.info("tape.share_id.generated", { shareId });

  // Generate the management token once — never derived from shareId
  const managementToken = crypto.randomBytes(32).toString("base64url");

  const now = new Date().toISOString();
  const tape = {
    id: crypto.randomUUID(),
    shareId,
    managementToken, // stored internally, never in public responses
    title,
    recipient,
    inscription,
    senderNote,
    songs: await normalizeSongs(songs, files),
    createdAt: now,
    updatedAt: now
  };

  tapes.push(tape);
  await writeTapes(tapes);
  logger.info("tape.created", {
    tapeId: tape.id,
    shareId: tape.shareId,
    songCount: tape.songs.length
    // managementToken intentionally NOT logged
  });
  return tape;
}

export async function updateTapeFromDraft(shareId, managementToken, rawTape, files = []) {
  const draft = parseDraft(rawTape);
  const tapes = await readTapes();
  const normalizedShareId = cleanText(shareId, 80);
  const index = tapes.findIndex((entry) => entry.shareId === normalizedShareId);
  if (index === -1) fail("This tape could not be found.", 404);

  const currentTape = tapes[index];

  // Authenticate management token before any mutation
  verifyManagementToken(currentTape, managementToken);

  const { recipient, title, inscription, senderNote, songs } = validateDraftFields(draft);

  // Collect old local filenames before building the new state
  const oldLocalFiles = localFileNamesFromSongs(currentTape.songs);

  const updatedTape = {
    ...currentTape,
    title,
    recipient,
    inscription,
    senderNote,
    songs: await normalizeSongs(songs, files),
    updatedAt: new Date().toISOString()
  };

  // Persist the new state first — cleanup only runs after successful write
  tapes[index] = updatedTape;
  await writeTapes(tapes);
  logger.info("tape.updated", {
    tapeId: updatedTape.id,
    shareId: updatedTape.shareId,
    songCount: updatedTape.songs.length
  });

  // Now determine which old local files are no longer referenced
  const newLocalFiles = localFileNamesFromSongs(updatedTape.songs);
  const orphanedFiles = [...oldLocalFiles].filter((name) => !newLocalFiles.has(name));
  if (orphanedFiles.length > 0) {
    logger.info("file.cleanup.start", { count: orphanedFiles.length });
    await deleteLocalFiles(orphanedFiles);
  }

  return updatedTape;
}

export async function findTapeByShareId(shareId) {
  const tapes = await readTapes();
  return tapes.find((entry) => entry.shareId === cleanText(shareId, 80));
}

// Find a tape by managementToken (for the management page load).
// Returns the full tape object (including managementToken) for internal use only.
export async function findTapeByManagementToken(token) {
  if (!token || token.length < 10) return null;
  const tapes = await readTapes();
  return tapes.find((entry) => entry.managementToken === token) || null;
}

export async function deleteTapeByManagementToken(shareId, managementToken) {
  const tapes = await readTapes();
  const normalizedShareId = cleanText(shareId, 80);
  const index = tapes.findIndex((entry) => entry.shareId === normalizedShareId);
  if (index === -1) fail("This tape could not be found.", 404);

  const tape = tapes[index];

  // Authenticate before any destructive action
  verifyManagementToken(tape, managementToken);

  // Collect local files belonging to this tape
  const localFilesToDelete = [...localFileNamesFromSongs(tape.songs)];

  // Remove the tape record and persist FIRST
  const remainingTapes = tapes.filter((_, i) => i !== index);
  await writeTapes(remainingTapes);
  logger.info("tape.deleted", {
    tapeId: tape.id,
    shareId: tape.shareId
    // managementToken intentionally NOT logged
  });

  // ONLY after successful persistence, delete the audio files
  if (localFilesToDelete.length > 0) {
    logger.info("file.cleanup.start", { count: localFilesToDelete.length, reason: "tape_deleted" });
    await deleteLocalFiles(localFilesToDelete);
  }
}
