# MusTape Backend

Express API for creating and opening MusTape cassette letters.

## Run Backend

```bash
npm install
npm run dev
```

The API listens on `PORT` or `5000` by default. Uploaded audio is served from `/uploads`, and tapes are stored in `storage/tapes.json`.

## Environment

```bash
PORT=5000
FRONTEND_ORIGIN=http://localhost:3000
ALLOWED_ORIGINS=http://localhost:3000
MAX_UPLOAD_SIZE_MB=25
MAX_SONGS=24
JSON_LIMIT=1mb
LOG_LEVEL=info
MUSTAPE_RUNTIME_DIR=
```

Origins are normalized before comparison, so a trailing slash in Render's
environment settings does not break CORS. Put the canonical Vercel origin in
`FRONTEND_ORIGIN` and add any other trusted custom or preview origins explicitly
to the comma-separated `ALLOWED_ORIGINS` value.

In production, attach a persistent Render disk and set `MUSTAPE_RUNTIME_DIR` to
its mount path. MusTape keeps both `storage/tapes.json` and `uploads/` beneath
that directory. Without a persistent disk, tapes and uploaded audio are lost
when Render replaces the service instance.

## Routes

- `POST /api/tapes` creates a tape and generates a permanent `shareId`.
- `PUT /api/tapes/:shareId` updates an existing tape without changing its `shareId`.
- `GET /api/tapes/:shareId` returns the latest public receiver-safe tape.
- `GET /health` returns API health.

## Folder Structure

- `controllers/` request/response orchestration
- `routes/` REST route registration
- `services/` validation, normalization, external metadata, logging, and errors
- `storage/` persistence abstraction
- `middleware/` uploads, request logging, and error handling
- `config/` paths and runtime configuration
- `uploads/` runtime audio uploads, ignored by Git except `.gitkeep`

## Production Notes

The current storage is intentionally simple JSON persistence. Future database migration should happen behind `storage/tapeStore.js` so routes, controllers, and frontend API behavior remain stable.

Backend logs are structured JSON and intentionally avoid logging user note, title, recipient, or memory content.
