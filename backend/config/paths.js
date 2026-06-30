import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const backendRoot = path.resolve(path.dirname(__filename), "..");

export const paths = {
  backendRoot,
  storageDir: path.join(backendRoot, "storage"),
  dataFile: path.join(backendRoot, "storage", "tapes.json"),
  uploadDir: path.join(backendRoot, "uploads")
};

fs.mkdirSync(paths.storageDir, { recursive: true });
fs.mkdirSync(paths.uploadDir, { recursive: true });
