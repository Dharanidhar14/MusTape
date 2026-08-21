import fs from "node:fs/promises";
import crypto from "node:crypto";
import { query, getClient } from "../db/index.js";
import { initDb } from "../db/schema.js";

async function migrate() {
  console.log("Starting DB initialization...");
  await initDb();
  console.log("Reading tapes.json...");
  
  let tapesData = [];
  try {
    const raw = await fs.readFile("./storage/tapes.json", "utf-8");
    tapesData = JSON.parse(raw);
  } catch (err) {
    if (err.code === "ENOENT") {
      console.log("No tapes.json found. Nothing to migrate.");
      return;
    }
    throw err;
  }

  console.log(`Found ${tapesData.length} legacy tapes to migrate.`);

  const client = await getClient();
  try {
    await client.query('BEGIN');

    for (const tape of tapesData) {
      // Check if tape already exists to make script idempotent
      const existing = await client.query(`SELECT id FROM tapes WHERE share_id = $1`, [tape.shareId]);
      if (existing.rowCount > 0) {
        console.log(`Tape ${tape.shareId} already migrated. Skipping.`);
        continue;
      }

      const managementTokenHash = crypto.createHash('sha256').update(tape.managementToken).digest('hex');
      
      const tapeResult = await client.query(`
        INSERT INTO tapes (id, share_id, management_token_hash, title, recipient, inscription, sender_note, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        RETURNING id
      `, [tape.id, tape.shareId, managementTokenHash, tape.title, tape.recipient, tape.inscription, tape.senderNote, tape.createdAt, tape.updatedAt]);
      
      let sortOrder = 0;
      for (const song of tape.songs || []) {
        await client.query(`
          INSERT INTO songs (id, tape_id, type, title, artist, memory, spotify_url, spotify_track_id, youtube_url, youtube_video_id, file_name, original_file_name, audio_path, embed_url, sort_order)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
        `, [
          song.id, tape.id, song.type, song.title, song.artist, song.memory, 
          song.spotifyUrl, song.spotifyTrackId, song.youtubeUrl, song.youtubeVideoId, 
          song.fileName, song.originalFileName, song.audioPath, song.embedUrl, sortOrder
        ]);
        sortOrder++;
      }
      
      console.log(`Migrated tape ${tape.shareId} with ${tape.songs?.length || 0} songs.`);
    }

    await client.query('COMMIT');
    console.log("Migration complete!");
  } catch (err) {
    await client.query('ROLLBACK');
    console.error("Migration failed:", err);
  } finally {
    client.release();
    process.exit(0);
  }
}

migrate();
