import multer from "multer";
import path from "node:path";
import { paths } from "../config/paths.js";
import { serverConfig } from "../config/server.js";

const allowedMimeTypes = new Set([
  "audio/mpeg",
  "audio/mp3",
  "audio/wav",
  "audio/x-wav",
  "audio/mp4",
  "audio/m4a",
  "audio/aac",
  "audio/ogg"
]);

const allowedExtensions = new Set([".mp3", ".wav", ".m4a", ".ogg"]);

const storage = multer.diskStorage({
  destination: paths.uploadDir,
  filename(_request, file, callback) {
    const extension = path.extname(file.originalname).toLowerCase();
    const safeBase = path
      .basename(file.originalname, extension)
      .replace(/[^a-z0-9-]+/gi, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 48);
    callback(null, `${Date.now()}-${safeBase || "song"}${extension}`);
  }
});

export const uploadLocalSongs = multer({
  storage,
  limits: {
    fileSize: serverConfig.maxUploadSize,
    files: serverConfig.maxSongs
  },
  fileFilter(_request, file, callback) {
    const extension = path.extname(file.originalname).toLowerCase();
    if (allowedMimeTypes.has(file.mimetype) || allowedExtensions.has(extension)) {
      callback(null, true);
      return;
    }
    callback(Object.assign(new Error("Only mp3, wav, m4a, and ogg audio files can be placed on a tape."), { status: 400 }));
  }
});
