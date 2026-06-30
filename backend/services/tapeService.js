import crypto from "node:crypto";
import { serverConfig } from "../config/server.js";
import { readTapes, writeTapes } from "../storage/tapeStore.js";
import { extractSpotifyTrackId, extractYouTubeVideoId, spotifyEmbedUrl, spotifyTrackMetadata, youtubeEmbedUrl } from "./spotifyService.js";
import { cleanText, fail } from "./textService.js";

const MAX_TEXT = 700;
const MAX_TITLE = 120;

export function publicTape(tape, request) {
  const baseUrl = `${request.protocol}://${request.get("host")}`;
  return {
    ...tape,
    songs: tape.songs.map((song) => {
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
  if (!inscription) fail("Leave a note before sealing the tape.");
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
    songs: await normalizeSongs(songs, files),
    createdAt: now,
    updatedAt: now
  };

  tapes.push(tape);
  await writeTapes(tapes);
  return tape;
}

export async function updateTapeFromDraft(shareId, rawTape, files = []) {
  if (!rawTape) fail("The tape arrived without its letter.");

  let draft;
  try {
    draft = JSON.parse(rawTape);
  } catch {
    fail("The tape could not be read. Please try sealing it again.");
  }

  const tapes = await readTapes();
  const normalizedShareId = cleanText(shareId, 80);
  const index = tapes.findIndex((entry) => entry.shareId === normalizedShareId);
  if (index === -1) fail("This tape could not be found.", 404);

  const currentTape = tapes[index];
  const recipient = cleanText(draft.recipient, MAX_TITLE);
  const title = cleanText(draft.title, MAX_TITLE);
  const inscription = cleanText(draft.inscription, 1200);
  const senderNote = cleanText(draft.senderNote, 500);
  const songs = Array.isArray(draft.songs) ? draft.songs : [];

  if (!recipient) fail("Add the recipient before sealing the tape.");
  if (!title) fail("Give the tape a title before sealing it.");
  if (!inscription) fail("Leave a note before sealing the tape.");
  if (!songs.length) fail("A tape needs at least one song before it can be sealed.");
  if (songs.length > serverConfig.maxSongs) fail("This tape is too full. Keep it under 24 songs.");

  const updatedTape = {
    ...currentTape,
    title,
    recipient,
    inscription,
    senderNote,
    songs: await normalizeSongs(songs, files),
    updatedAt: new Date().toISOString()
  };

  tapes[index] = updatedTape;
  await writeTapes(tapes);
  return updatedTape;
}

export async function findTapeByShareId(shareId) {
  const tapes = await readTapes();
  return tapes.find((entry) => entry.shareId === cleanText(shareId, 80));
}
