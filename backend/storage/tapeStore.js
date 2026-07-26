import fs from "node:fs/promises";
import { paths } from "../config/paths.js";
import { logger } from "../services/logger.js";

async function ensureDataFile() {
  try {
    await fs.access(paths.dataFile);
  } catch {
    await fs.writeFile(paths.dataFile, "[]\n", "utf8");
    logger.info("storage.created", { store: "tapes" });
  }
}

export async function readTapes() {
  await ensureDataFile();
  const contents = await fs.readFile(paths.dataFile, "utf8");
  try {
    const parsed = JSON.parse(contents);
    const tapes = Array.isArray(parsed) ? parsed : [];
    logger.debug("storage.read", { store: "tapes", count: tapes.length });
    return tapes;
  } catch {
    logger.warn("storage.invalid_json", { store: "tapes" });
    return [];
  }
}

export async function writeTapes(tapes) {
  await ensureDataFile();
  const temporaryFile = `${paths.dataFile}.tmp`;
  await fs.writeFile(temporaryFile, `${JSON.stringify(tapes, null, 2)}\n`, "utf8");
  await fs.rename(temporaryFile, paths.dataFile);
  logger.info("storage.write", { store: "tapes", count: tapes.length });
}
