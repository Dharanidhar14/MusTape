import crypto from "node:crypto";
import { serverConfig } from "../config/server.js";
import { readTapes, writeTapes } from "../storage/tapeStore.js";
import { extractSpotifyTrackId, spotifyEmbedUrl } from "./spotifyService.js";
import { cleanText, fail } from "./textService.js";

const MAX_TEXT = 700;
const MAX_TITLE = 120;

export function publicTape(tape, request) {
  const baseUrl = `${request.protocol}://${request.get("host")}`;
  return {
    ...tape,
    songs: tape.songs.map((song) => {
      if (song.type !== "local") return song;
      return {
        ...song,
        audioUrl: `${baseUrl}${song.audioPath}`
      };
    })
  };
}

function normalizeSongs(songs, files) {
  const usedFileIndexes = new Set();

  return songs.map((song, index) => {
    const type = song.type;
    const memory = cleanText(song.memory, MAX_TEXT);
    const artist = cleanText(song.artist, MAX_TITLE);

    if (type === "spotify") {
      const spotifyUrl = cleanText(song.spotifyUrl, 300);
      const spotifyTrackId = extractSpotifyTrackId(spotifyUrl);
      if (!spotifyTrackId) fail(`Song ${index + 1} needs a valid Spotify track link.`);

      return {
        id: crypto.randomUUID(),
        type: "spotify",
        title: cleanText(song.title, MAX_TITLE) || "Spotify trace",
        artist,
        memory,
        spotifyUrl,
        spotifyTrackId,
        embedUrl: spotifyEmbedUrl(spotifyTrackId)
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
  });
}

export async function createTapeFromDraft(rawTape, files = []) {
  if (!rawTape) fail("The tape arrived without its letter.");

  let draft;
  try {
    draft = JSON.parse(rawTape);
  } catch {
    fail("The tape could not be read. Please try sealing it again.");
  }

  const recipient = cleanText(draft.recipient, MAX_TITLE);
  const title = cleanText(draft.title, MAX_TITLE);
  const inscription = cleanText(draft.inscription, 1200);
  const senderNote = cleanText(draft.senderNote, 500);
  const songs = Array.isArray(draft.songs) ? draft.songs : [];

  if (!recipient) fail("Add the recipient before sealing the tape.");
  if (!title) fail("Give the tape a title before sealing it.");
  if (!inscription) fail("Leave an inscription before sealing the tape.");
  if (!songs.length) fail("A tape needs at least one song before it can be sealed.");
  if (songs.length > serverConfig.maxSongs) fail("This tape is too full. Keep it under 24 songs.");

  const tapes = await readTapes();
  let shareId = crypto.randomBytes(5).toString("base64url");
  while (tapes.some((tape) => tape.shareId === shareId)) {
    shareId = crypto.randomBytes(5).toString("base64url");
  }

  const now = new Date().toISOString();
  const tape = {
    id: crypto.randomUUID(),
    shareId,
    title,
    recipient,
    inscription,
    senderNote,
    songs: normalizeSongs(songs, files),
    createdAt: now,
    updatedAt: now
  };

  tapes.push(tape);
  await writeTapes(tapes);
  return tape;
}

export async function findTapeByShareId(shareId) {
  const tapes = await readTapes();
  return tapes.find((entry) => entry.shareId === cleanText(shareId, 80));
}
