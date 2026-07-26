function publicUrl(name: string, value: string | undefined, fallback?: string) {
  const candidate = value?.trim() || fallback;

  if (!candidate) return undefined;

  let parsed: URL;
  try {
    parsed = new URL(candidate);
  } catch {
    throw new Error(`${name} must be an absolute http or https URL.`);
  }

  if (!["http:", "https:"].includes(parsed.protocol)) {
    throw new Error(`${name} must be an absolute http or https URL.`);
  }

  if (process.env.NODE_ENV === "production" && parsed.protocol !== "https:") {
    throw new Error(`${name} must use https in production.`);
  }

  return parsed.toString().replace(/\/$/, "");
}

const configuredApiUrl = process.env.NEXT_PUBLIC_API_URL;

if (process.env.NODE_ENV === "production" && !configuredApiUrl?.trim()) {
  throw new Error("NEXT_PUBLIC_API_URL is required for production builds.");
}

export const apiBaseUrl = publicUrl(
  "NEXT_PUBLIC_API_URL",
  configuredApiUrl,
  "http://localhost:5000"
)!;

export const appBaseUrl = publicUrl(
  "NEXT_PUBLIC_APP_URL",
  process.env.NEXT_PUBLIC_APP_URL
);

export const clientConfig = {
  themeStorageKey: "mustape-theme",
  maxSongs: 24,
  maxUploadSizeMb: 25,
  acceptedAudioExtensions: [".mp3", ".wav", ".m4a", ".ogg"],
  acceptedAudioMimeTypes: [
    "audio/mpeg",
    "audio/mp3",
    "audio/wav",
    "audio/x-wav",
    "audio/mp4",
    "audio/m4a",
    "audio/aac",
    "audio/ogg"
  ]
} as const;
