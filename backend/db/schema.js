import { query } from "./index.js";
import { logger } from "../services/logger.js";

export async function initDb() {
  logger.info("db.init.start");

  await query(`
    CREATE TABLE IF NOT EXISTS users (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      google_sub VARCHAR(255) UNIQUE NOT NULL,
      email VARCHAR(255),
      display_name VARCHAR(255),
      avatar_url TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );
  `);

  await query(`
    CREATE TABLE IF NOT EXISTS sessions (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID REFERENCES users(id) ON DELETE CASCADE,
      token_hash VARCHAR(255) NOT NULL,
      expires_at TIMESTAMPTZ NOT NULL,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      revoked_at TIMESTAMPTZ
    );
  `);

  await query(`
    CREATE TABLE IF NOT EXISTS collections (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID REFERENCES users(id) ON DELETE CASCADE,
      name VARCHAR(255) NOT NULL,
      recipient_name VARCHAR(255),
      recipient_email VARCHAR(255),
      sender_name VARCHAR(255),
      description TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );
  `);

  await query(`
    CREATE TABLE IF NOT EXISTS tapes (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      collection_id UUID REFERENCES collections(id) ON DELETE SET NULL,
      share_id VARCHAR(50) UNIQUE NOT NULL,
      management_token_hash VARCHAR(255) NOT NULL,
      title VARCHAR(120),
      recipient VARCHAR(120),
      inscription TEXT,
      sender_note TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );
  `);

  await query(`
    CREATE TABLE IF NOT EXISTS songs (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      tape_id UUID REFERENCES tapes(id) ON DELETE CASCADE,
      type VARCHAR(20) NOT NULL,
      title VARCHAR(120),
      artist VARCHAR(120),
      memory TEXT,
      spotify_url TEXT,
      spotify_track_id VARCHAR(100),
      youtube_url TEXT,
      youtube_video_id VARCHAR(100),
      file_name TEXT,
      original_file_name TEXT,
      audio_path TEXT,
      embed_url TEXT,
      sort_order INTEGER NOT NULL,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );
  `);

  // Indexes
  await query(`CREATE INDEX IF NOT EXISTS idx_users_google_sub ON users(google_sub);`);
  await query(`CREATE INDEX IF NOT EXISTS idx_sessions_token_hash ON sessions(token_hash);`);
  await query(`CREATE INDEX IF NOT EXISTS idx_collections_user_id ON collections(user_id);`);
  await query(`CREATE INDEX IF NOT EXISTS idx_tapes_collection_id ON tapes(collection_id);`);
  await query(`CREATE INDEX IF NOT EXISTS idx_tapes_share_id ON tapes(share_id);`);
  await query(`CREATE INDEX IF NOT EXISTS idx_songs_tape_id ON songs(tape_id);`);

  logger.info("db.init.complete");
}
