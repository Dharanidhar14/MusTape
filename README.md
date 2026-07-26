# MusTape

MusTape is a memory preservation experience built around a private cassette-letter ritual. A sender composes a tape from songs and notes, seals it into a stable share link, and the receiver opens it as a quiet keepsake.

Version: **3.0.2** — The Production Reliability Update.

## Product Principles

- The tape is the primary object.
- The sender-to-receiver ritual should feel personal, not transactional.
- Music is the medium; memory is the product.
- The ending footer remains part of the experience:

> The tape has reached its end.
> But memories rarely do.

## Architecture

```text
frontend/  Next.js, React, TypeScript, Tailwind CSS, Framer Motion
backend/   Node.js, Express, Multer, JSON storage abstraction
```

The frontend talks to the backend through `NEXT_PUBLIC_API_URL`. The backend persists tapes through `backend/storage/tapeStore.js`, which currently writes JSON and can be replaced later by a database-backed implementation without changing controllers.

## Data Flow

1. Sender writes recipient, title, note, and song memories in the composer.
2. Sender adds Spotify/YouTube links or uploads local audio.
3. Frontend sends multipart form data to the backend.
4. Backend validates, normalizes, stores the tape, and returns `/tape/:shareId`.
5. Receiver page fetches the latest tape by `shareId`.
6. Local songs stream from `/uploads`; external songs render official embeds.

## Run Locally

Backend:

```bash
cd backend
npm install
npm run dev
```

Frontend:

```bash
cd frontend
npm install
npm run dev
```

Default URLs:

- Frontend: `http://localhost:3000`
- Backend: `http://localhost:5000`

## Environment

Frontend:

```bash
NEXT_PUBLIC_API_URL=http://localhost:5000
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

Backend:

```bash
PORT=5000
FRONTEND_ORIGIN=http://localhost:3000
ALLOWED_ORIGINS=http://localhost:3000
MAX_UPLOAD_SIZE_MB=25
MAX_SONGS=24
LOG_LEVEL=info
MUSTAPE_RUNTIME_DIR=
```

## Deployment Notes

- Serve the frontend and backend as separate services.
- Set `NEXT_PUBLIC_API_URL` to the deployed backend URL.
- Set `FRONTEND_ORIGIN` and `ALLOWED_ORIGINS` to the deployed frontend origin.
- Attach a Render persistent disk and set `MUSTAPE_RUNTIME_DIR` to its mount path.
- Keep local `backend/uploads` and `backend/storage/*.json` out of Git.
- A future database implementation can replace `tapeStore.js` without changing the HTTP API.

## v3.0.2

- Fails Vercel production builds when `NEXT_PUBLIC_API_URL` is missing or insecure.
- Normalizes and validates Render CORS origins.
- Trusts Render's proxy so local-audio URLs are generated with HTTPS.
- Supports persistent tape and upload storage through `MUSTAPE_RUNTIME_DIR`.
- Adds structured request IDs and production-safe API errors.

## Repository Hygiene

Generated/runtime files are ignored:

- `node_modules`
- `.next`, `dist`, `build`, `coverage`
- `.env*`
- `backend/uploads/*`
- `backend/storage/*.json`
- `screenshots`
- logs and local caches
