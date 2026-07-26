const levels = {
  debug: 10,
  info: 20,
  warn: 30,
  error: 40
};

const configuredLevel = process.env.LOG_LEVEL || (process.env.NODE_ENV === "production" ? "info" : "debug");
const minimumLevel = levels[configuredLevel] || levels.info;

function write(level, event, details = {}) {
  if (levels[level] < minimumLevel) return;

  const entry = {
    time: new Date().toISOString(),
    level,
    event,
    ...details
  };

  const output = JSON.stringify(entry);
  if (level === "error") {
    console.error(output);
    return;
  }
  if (level === "warn") {
    console.warn(output);
    return;
  }
  console.log(output);
}

export const logger = {
  debug: (event, details) => write("debug", event, details),
  info: (event, details) => write("info", event, details),
  warn: (event, details) => write("warn", event, details),
  error: (event, details) => write("error", event, details)
};
