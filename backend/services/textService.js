import { fail } from "./errors.js";

export function cleanText(value, max = 700) {
  return String(value || "").replace(/\s+/g, " ").trim().slice(0, max);
}

export { fail };
