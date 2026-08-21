import { OAuth2Client } from "google-auth-library";
import { serverConfig } from "../config/server.js";
import { logger } from "./logger.js";
import { fail } from "./textService.js";
import crypto from "node:crypto";
import { query } from "../db/index.js";

const client = new OAuth2Client(serverConfig.googleClientId);

export async function verifyGoogleToken(idToken) {
  if (!idToken) {
    fail("No Google credential provided.", 401, "MUSTAPE_NO_CREDENTIAL");
  }

  try {
    const ticket = await client.verifyIdToken({
      idToken,
      audience: serverConfig.googleClientId
    });

    const payload = ticket.getPayload();
    if (!payload) {
      fail("Invalid Google credential.", 401, "MUSTAPE_INVALID_CREDENTIAL");
    }

    return {
      sub: payload.sub,
      email: payload.email,
      name: payload.name,
      picture: payload.picture
    };
  } catch (error) {
    logger.warn("auth.google_verify_failed", { error: error.message });
    fail("Failed to verify Google credential.", 401, "MUSTAPE_INVALID_CREDENTIAL");
  }
}

export async function createSession(googleUser) {
  // Upsert user
  const userResult = await query(`
    INSERT INTO users (google_sub, email, display_name, avatar_url, updated_at)
    VALUES ($1, $2, $3, $4, NOW())
    ON CONFLICT (google_sub) DO UPDATE 
    SET email = EXCLUDED.email, display_name = EXCLUDED.display_name, avatar_url = EXCLUDED.avatar_url, updated_at = NOW()
    RETURNING id, display_name, email, avatar_url, google_sub
  `, [googleUser.sub, googleUser.email, googleUser.name, googleUser.picture]);

  const user = userResult.rows[0];

  const sessionId = crypto.randomBytes(32).toString("base64url");
  const tokenHash = crypto.createHash('sha256').update(sessionId).digest('hex');
  
  // 30 days expiry
  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

  await query(`
    INSERT INTO sessions (user_id, token_hash, expires_at)
    VALUES ($1, $2, $3)
  `, [user.id, tokenHash, expiresAt.toISOString()]);

  return {
    id: sessionId,
    googleSub: user.google_sub,
    email: user.email,
    name: user.display_name,
    picture: user.avatar_url
  };
}

export async function getSession(sessionId) {
  if (!sessionId) return null;
  const tokenHash = crypto.createHash('sha256').update(sessionId).digest('hex');

  const result = await query(`
    SELECT s.expires_at, s.revoked_at, u.google_sub, u.email, u.display_name, u.avatar_url
    FROM sessions s
    JOIN users u ON s.user_id = u.id
    WHERE s.token_hash = $1
  `, [tokenHash]);

  if (result.rowCount === 0) return null;

  const row = result.rows[0];
  if (row.revoked_at || new Date(row.expires_at) < new Date()) {
    return null; // Expired or revoked
  }

  return {
    googleSub: row.google_sub,
    email: row.email,
    name: row.display_name,
    picture: row.avatar_url
  };
}

export async function destroySession(sessionId) {
  if (!sessionId) return;
  const tokenHash = crypto.createHash('sha256').update(sessionId).digest('hex');
  
  await query(`
    UPDATE sessions
    SET revoked_at = NOW()
    WHERE token_hash = $1
  `, [tokenHash]);
}
