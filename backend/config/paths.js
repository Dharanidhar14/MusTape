import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const backendRoot = path.resolve(path.dirname(__filename), "..");
const runtimeRoot = process.env.MUSTAPE_RUNTIME_DIR
  ? path.resolve(process.env.MUSTAPE_RUNTIME_DIR)
  : backendRoot;

export const paths = {
  backendRoot,
  runtimeRoot,
  storageDir: path.join(runtimeRoot, "storage"),
  dataFile: path.join(runtimeRoot, "storage", "tapes.json"),
  uploadDir: path.join(runtimeRoot, "uploads")
};

fs.mkdirSync(paths.storageDir, { recursive: true });
fs.mkdirSync(paths.uploadDir, { recursive: true });
