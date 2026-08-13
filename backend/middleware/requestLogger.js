import crypto from "node:crypto";
import { logger } from "../services/logger.js";

const MANAGE_PREFIX = "/api/manage/";

export function safePath(requestPath) {
  if (requestPath.startsWith(MANAGE_PREFIX) && requestPath.length > MANAGE_PREFIX.length) {
    return `${MANAGE_PREFIX}[redacted]`;
  }
  return requestPath;
}

export function requestLogger(request, response, next) {
  const requestId = crypto.randomUUID();
  const startedAt = performance.now();

  request.id = requestId;
  response.setHeader("X-Request-Id", requestId);

  const sanitizedPath = safePath(request.path);

  logger.info("request.start", {
    requestId,
    method: request.method,
    path: sanitizedPath
  });

  response.on("finish", () => {
    logger.info("request.finish", {
      requestId,
      method: request.method,
      path: sanitizedPath,
      status: response.statusCode,
      durationMs: Math.round(performance.now() - startedAt)
    });
  });

  next();
}
