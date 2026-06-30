# MusTape

MusTape is a product foundation for turning songs into private memory objects.

The interface is intentionally small: a tactile tape preview, a writing surface, and a quiet ritual. It is designed to feel less like managing playlists and more like composing a keepsake.

## Design Direction

- **Brand:** MusTape
- **Tagline:** A keepsake for sound.
- **Metaphor:** A handmade cassette letter.
- **Voice:** Warm, restrained, personal, never corporate.
- **Palette:** Paper, ink, rosewood, brass, moss, ember, and oxblood.
- **Motion:** Slow object movement, focused transitions, no decoration without purpose.

## Run Frontend

```bash
npm install
npm run dev
```

Create `.env.local` when the API is not on the default URL:

```bash
NEXT_PUBLIC_API_URL=http://localhost:5000
```

The backend must be running for sealing tapes, loading shared links, Spotify embed data, and uploaded local audio.
