import fs from "node:fs/promises";
import { paths } from "../config/paths.js";

async function ensureDataFile() {
  try {
    await fs.access(paths.dataFile);
  } catch {
    await fs.writeFile(paths.dataFile, "[]\n", "utf8");
  }
}

export async function readTapes() {
  await ensureDataFile();
  const contents = await fs.readFile(paths.dataFile, "utf8");
  try {
    const parsed = JSON.parse(contents);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export async function writeTapes(tapes) {
  await ensureDataFile();
  const temporaryFile = `${paths.dataFile}.tmp`;
  await fs.writeFile(temporaryFile, `${JSON.stringify(tapes, null, 2)}\n`, "utf8");
  await fs.rename(temporaryFile, paths.dataFile);
}
