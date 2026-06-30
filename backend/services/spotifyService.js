export function extractSpotifyTrackId(input) {
  try {
    const url = new URL(input);
    if (url.hostname !== "open.spotify.com") return null;
    const [kind, trackId] = url.pathname.split("/").filter(Boolean);
    if (kind !== "track" || !trackId) return null;
    return /^[A-Za-z0-9]{16,32}$/.test(trackId) ? trackId : null;
  } catch {
    return null;
  }
}

export function spotifyEmbedUrl(trackId) {
  return `https://open.spotify.com/embed/track/${trackId}`;
}
