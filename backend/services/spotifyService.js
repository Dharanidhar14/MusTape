export function extractSpotifyTrackId(input) {
  const value = input.trim();
  const uriMatch = value.match(/^spotify:track:([A-Za-z0-9]{16,32})$/);
  if (uriMatch) return uriMatch[1];

  try {
    const url = new URL(value);
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

export async function spotifyTrackMetadata(spotifyUrl) {
  try {
    const response = await fetch(`https://open.spotify.com/oembed?url=${encodeURIComponent(spotifyUrl)}`, {
      headers: { accept: "application/json" }
    });
    if (!response.ok) return null;

    const body = await response.json();
    return {
      title: typeof body.title === "string" ? body.title.trim() : "",
      author: typeof body.author_name === "string" ? body.author_name.trim() : "",
      thumbnailUrl: typeof body.thumbnail_url === "string" ? body.thumbnail_url : ""
    };
  } catch {
    return null;
  }
}

export function extractYouTubeVideoId(input) {
  const value = input.trim();

  try {
    const url = new URL(value);
    const host = url.hostname.replace(/^www\./, "");

    if (host === "youtu.be") {
      const [videoId] = url.pathname.split("/").filter(Boolean);
      return isYouTubeId(videoId) ? videoId : null;
    }

    if (host === "youtube.com" || host === "m.youtube.com") {
      if (url.pathname === "/watch") {
        const videoId = url.searchParams.get("v");
        return isYouTubeId(videoId) ? videoId : null;
      }

      const [kind, videoId] = url.pathname.split("/").filter(Boolean);
      if (kind === "embed") return isYouTubeId(videoId) ? videoId : null;
    }

    return null;
  } catch {
    return null;
  }
}

export function youtubeEmbedUrl(videoId) {
  return `https://www.youtube.com/embed/${videoId}`;
}

function isYouTubeId(value) {
  return typeof value === "string" && /^[A-Za-z0-9_-]{11}$/.test(value);
}
