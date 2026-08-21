import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import { paths } from "../config/paths.js";
import { serverConfig } from "../config/server.js";
import { extractSpotifyTrackId, extractYouTubeVideoId, spotifyEmbedUrl, spotifyTrackMetadata, youtubeEmbedUrl } from "./spotifyService.js";
import { logger } from "./logger.js";
import { cleanText, fail } from "./textService.js";
import { query, getClient } from "../db/index.js";

const MAX_TEXT = 700;
const MAX_TITLE = 120;

export function publicTape(tape, request) {
  const baseUrl = `${request.protocol}://${request.get("host")}`;
  // eslint-disable-next-line no-unused-vars
  const { managementToken, management_token_hash, collection_id, ...safeTape } = tape;
  return {
    ...safeTape,
    songs: safeTape.songs.map((song) => {
      if (song.type === "spotify") {
        return { ...song, title: cleanSpotifyTitle(song.title) };
      }
      if (song.type !== "local") return song;
      return { ...song, audioUrl: `${baseUrl}${song.audioPath}` };
    })
  };
}

export function verifyManagementToken(tape, token) {
  if (!token) fail("This action requires a valid management link.", 403, "MUSTAPE_UNAUTHORIZED");
  const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
  if (tokenHash !== tape.management_token_hash) {
    fail("This action requires a valid management link.", 403, "MUSTAPE_UNAUTHORIZED");
  }
}

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
        type: "spotify",
        title: title !== "Spotify Track" ? title : metadataTitle || "Spotify Track",
        artist: artist || metadataAuthor,
        memory,
        spotifyUrl,
        spotifyTrackId,
        embedUrl: spotifyEmbedUrl(spotifyTrackId),
        sortOrder: index
      };
    }

    if (type === "youtube") {
      const youtubeUrl = cleanText(song.youtubeUrl, 300);
      const youtubeVideoId = extractYouTubeVideoId(youtubeUrl);
      if (!youtubeVideoId) fail(`Song ${index + 1} needs a valid YouTube link.`);
      return {
        type: "youtube",
        title: cleanText(song.title, MAX_TITLE) || "YouTube trace",
        artist,
        memory,
        youtubeUrl,
        youtubeVideoId,
        embedUrl: youtubeEmbedUrl(youtubeVideoId),
        sortOrder: index
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
        type: "local",
        title,
        artist,
        memory,
        fileName: file.filename,
        originalFileName: file.originalname,
        audioPath: `/uploads/${file.filename}`,
        sortOrder: index
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

function localFileNamesFromSongs(songs) {
  return new Set(songs.filter((s) => s.type === "local" && s.fileName).map((s) => s.fileName));
}

// Map db row to JS object matching old structure
function mapTapeRow(row, songsRows) {
  return {
    id: row.id,
    shareId: row.share_id,
    management_token_hash: row.management_token_hash,
    collection_id: row.collection_id,
    title: row.title,
    recipient: row.recipient,
    inscription: row.inscription,
    senderNote: row.sender_note,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    songs: songsRows.map(s => ({
      id: s.id,
      type: s.type,
      title: s.title,
      artist: s.artist,
      memory: s.memory,
      spotifyUrl: s.spotify_url,
      spotifyTrackId: s.spotify_track_id,
      youtubeUrl: s.youtube_url,
      youtubeVideoId: s.youtube_video_id,
      fileName: s.file_name,
      originalFileName: s.original_file_name,
      audioPath: s.audio_path,
      embedUrl: s.embed_url
    }))
  };
}

export async function createTapeFromDraft(rawTape, files = [], collectionId = null) {
  const draft = parseDraft(rawTape);
  const { recipient, title, inscription, senderNote, songs } = validateDraftFields(draft);
  const normalizedSongs = await normalizeSongs(songs, files);
  
  const shareId = crypto.randomBytes(5).toString("base64url");
  const managementToken = crypto.randomBytes(32).toString("base64url");
  const managementTokenHash = crypto.createHash('sha256').update(managementToken).digest('hex');

  const client = await getClient();
  try {
    await client.query('BEGIN');
    const tapeResult = await client.query(`
      INSERT INTO tapes (collection_id, share_id, management_token_hash, title, recipient, inscription, sender_note)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `, [collectionId, shareId, managementTokenHash, title, recipient, inscription, senderNote]);
    
    const tapeRow = tapeResult.rows[0];
    const insertedSongs = [];

    for (const song of normalizedSongs) {
      const songResult = await client.query(`
        INSERT INTO songs (tape_id, type, title, artist, memory, spotify_url, spotify_track_id, youtube_url, youtube_video_id, file_name, original_file_name, audio_path, embed_url, sort_order)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
        RETURNING *
      `, [
        tapeRow.id, song.type, song.title, song.artist, song.memory, 
        song.spotifyUrl, song.spotifyTrackId, song.youtubeUrl, song.youtubeVideoId, 
        song.fileName, song.originalFileName, song.audioPath, song.embedUrl, song.sortOrder
      ]);
      insertedSongs.push(songResult.rows[0]);
    }
    await client.query('COMMIT');
    logger.info("tape.created", { tapeId: tapeRow.id, songCount: insertedSongs.length });
    
    const mapped = mapTapeRow(tapeRow, insertedSongs);
    // Attach managementToken for the response only during creation (needed to build the manage link)
    mapped.managementToken = managementToken;
    return mapped;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

export async function findTapeByShareId(shareId) {
  const normalizedShareId = cleanText(shareId, 80);
  const tapeResult = await query(`SELECT * FROM tapes WHERE share_id = $1`, [normalizedShareId]);
  if (tapeResult.rowCount === 0) return null;
  const songsResult = await query(`SELECT * FROM songs WHERE tape_id = $1 ORDER BY sort_order ASC`, [tapeResult.rows[0].id]);
  return mapTapeRow(tapeResult.rows[0], songsResult.rows);
}

export async function findTapeByManagementToken(token) {
  if (!token || token.length < 10) return null;
  const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
  const tapeResult = await query(`SELECT * FROM tapes WHERE management_token_hash = $1`, [tokenHash]);
  if (tapeResult.rowCount === 0) return null;
  const songsResult = await query(`SELECT * FROM songs WHERE tape_id = $1 ORDER BY sort_order ASC`, [tapeResult.rows[0].id]);
  const mapped = mapTapeRow(tapeResult.rows[0], songsResult.rows);
  mapped.managementToken = token; // Needed for internal logic since we matched the hash
  return mapped;
}

export async function updateTapeFromDraft(shareId, managementToken, rawTape, files = []) {
  const currentTape = await findTapeByShareId(shareId);
  if (!currentTape) fail("This tape could not be found.", 404);
  
  verifyManagementToken(currentTape, managementToken);
  
  const draft = parseDraft(rawTape);
  const { recipient, title, inscription, senderNote, songs } = validateDraftFields(draft);
  const normalizedSongs = await normalizeSongs(songs, files);
  
  const oldLocalFiles = localFileNamesFromSongs(currentTape.songs);
  
  const client = await getClient();
  let updatedTapeRow;
  let insertedSongs = [];
  try {
    await client.query('BEGIN');
    
    const updateResult = await client.query(`
      UPDATE tapes
      SET title = $1, recipient = $2, inscription = $3, sender_note = $4, updated_at = NOW()
      WHERE id = $5
      RETURNING *
    `, [title, recipient, inscription, senderNote, currentTape.id]);
    updatedTapeRow = updateResult.rows[0];

    // Replace all songs
    await client.query(`DELETE FROM songs WHERE tape_id = $1`, [currentTape.id]);
    
    for (const song of normalizedSongs) {
      const songResult = await client.query(`
        INSERT INTO songs (tape_id, type, title, artist, memory, spotify_url, spotify_track_id, youtube_url, youtube_video_id, file_name, original_file_name, audio_path, embed_url, sort_order)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
        RETURNING *
      `, [
        currentTape.id, song.type, song.title, song.artist, song.memory, 
        song.spotifyUrl, song.spotifyTrackId, song.youtubeUrl, song.youtubeVideoId, 
        song.fileName, song.originalFileName, song.audioPath, song.embedUrl, song.sortOrder
      ]);
      insertedSongs.push(songResult.rows[0]);
    }
    
    await client.query('COMMIT');
    logger.info("tape.updated", { tapeId: updatedTapeRow.id, songCount: insertedSongs.length });
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }

  const mapped = mapTapeRow(updatedTapeRow, insertedSongs);
  const newLocalFiles = localFileNamesFromSongs(mapped.songs);
  const orphanedFiles = [...oldLocalFiles].filter((name) => !newLocalFiles.has(name));
  if (orphanedFiles.length > 0) {
    logger.info("file.cleanup.start", { count: orphanedFiles.length });
    await deleteLocalFiles(orphanedFiles);
  }
  return mapped;
}

export async function deleteTapeByManagementToken(shareId, managementToken) {
  const tape = await findTapeByShareId(shareId);
  if (!tape) fail("This tape could not be found.", 404);

  verifyManagementToken(tape, managementToken);

  const localFilesToDelete = [...localFileNamesFromSongs(tape.songs)];

  await query(`DELETE FROM tapes WHERE id = $1`, [tape.id]);
  logger.info("tape.deleted", { tapeId: tape.id });

  if (localFilesToDelete.length > 0) {
    logger.info("file.cleanup.start", { count: localFilesToDelete.length, reason: "tape_deleted" });
    await deleteLocalFiles(localFilesToDelete);
  }
}
