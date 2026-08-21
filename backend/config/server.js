function numberFromEnv(name, fallback) {
  const value = Number(process.env[name]);
  return Number.isFinite(value) && value > 0 ? value : fallback;
}

function normalizeOrigin(value) {
  try {
    const url = new URL(String(value || "").trim());
    return ["http:", "https:"].includes(url.protocol) ? url.origin : "";
  } catch {
    return "";
  }
}

function originList(value) {
  return String(value || "")
    .split(",")
    .map(normalizeOrigin)
    .filter(Boolean);
}

const nodeEnv = process.env.NODE_ENV || "development";
const configuredFrontendOrigin = normalizeOrigin(process.env.FRONTEND_ORIGIN);

if (nodeEnv === "production" && !configuredFrontendOrigin) {
  throw new Error("FRONTEND_ORIGIN must be an absolute http or https URL in production.");
}

if (nodeEnv === "production" && !configuredFrontendOrigin.startsWith("https://")) {
  throw new Error("FRONTEND_ORIGIN must use https in production.");
}

const frontendOrigin = configuredFrontendOrigin || "http://localhost:3000";
const allowedOrigins = [...new Set([frontendOrigin, ...originList(process.env.ALLOWED_ORIGINS)])];

const googleClientId = process.env.GOOGLE_CLIENT_ID || "";
if (nodeEnv === "production" && !googleClientId) {
  throw new Error("GOOGLE_CLIENT_ID is required in production.");
}

const dbUrl = process.env.DATABASE_URL || "postgresql://localhost:5432/mustape";
if (nodeEnv === "production" && !process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is required in production.");
}

export const serverConfig = {
  nodeEnv,
  port: numberFromEnv("PORT", 5000),
  frontendOrigin,
  allowedOrigins,
  maxUploadSize: numberFromEnv("MAX_UPLOAD_SIZE_MB", 25) * 1024 * 1024,
  maxSongs: numberFromEnv("MAX_SONGS", 24),
  jsonLimit: process.env.JSON_LIMIT || "1mb",
  googleClientId,
  dbUrl
};
