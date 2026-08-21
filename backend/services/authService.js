import { OAuth2Client } from "google-auth-library";
import { serverConfig } from "../config/server.js";
import { logger } from "./logger.js";
import { fail } from "./textService.js";
import crypto from "node:crypto";

const client = new OAuth2Client(serverConfig.googleClientId);

// Simple in-memory session store for Phase 2 (will be replaced by PG in Phase 3)
const sessions = new Map();

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

export function createSession(googleUser) {
  const sessionId = crypto.randomBytes(32).toString("base64url");
  const session = {
    id: sessionId,
    googleSub: googleUser.sub,
    email: googleUser.email,
    name: googleUser.name,
    picture: googleUser.picture,
    createdAt: new Date().toISOString()
  };
  sessions.set(sessionId, session);
  return session;
}

export function getSession(sessionId) {
  if (!sessionId) return null;
  return sessions.get(sessionId) || null;
}

export function destroySession(sessionId) {
  if (sessionId) {
    sessions.delete(sessionId);
  }
}
