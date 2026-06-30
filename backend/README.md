# MusTape API

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
```
