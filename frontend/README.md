# MusTape Frontend

Next.js interface for turning songs into private memory objects.

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

## Architecture

- `app/page.tsx` renders the sender composer.
- `app/tape/[shareId]/page.tsx` renders the receiver route.
- `components/mustape-app.tsx` owns sender state and composition flow.
- `components/receiver-experience.tsx` owns the sealed/opened receiver ritual.
- `components/ui` contains lightweight design primitives.
- `lib/design-tokens.ts` centralizes product copy, typography, motion, surfaces, and button classes.
- `lib/config.ts` centralizes frontend runtime settings.
- `lib/mustape.ts` contains API calls, tape types, URL extraction, and form serialization.

## Environment

```bash
NEXT_PUBLIC_API_URL=http://localhost:5000
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

`NEXT_PUBLIC_APP_URL` is optional locally. It is useful in production when copied share links must use the public app origin.

`NEXT_PUBLIC_API_URL` is required for production builds and must use HTTPS.
MusTape fails the Vercel build instead of silently embedding the localhost API
fallback when this value is missing or invalid.

## Design System

MusTape keeps its design language in CSS variables and small reusable primitives:

- typography tokens for hero, section, card, caption, and footer quote text
- motion tokens for calm reveal timing and object drift
- shared button and icon-button primitives
- global focus, reduced-motion, dark-mode, input, and audio-range styling

The goal is consistency without turning the interface into a generic component library.
