export function cleanText(value, max = 700) {
  return String(value || "").replace(/\s+/g, " ").trim().slice(0, max);
}

export function fail(message, status = 400) {
  const error = new Error(message);
  error.status = status;
  throw error;
}
