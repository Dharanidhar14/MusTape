import crypto from "node:crypto";
import { logger } from "../services/logger.js";

export function requestLogger(request, response, next) {
  const requestId = crypto.randomUUID();
  const startedAt = performance.now();

  request.id = requestId;
  response.setHeader("X-Request-Id", requestId);

  logger.info("request.start", {
    requestId,
    method: request.method,
    path: request.path
  });

  response.on("finish", () => {
    logger.info("request.finish", {
      requestId,
      method: request.method,
      path: request.path,
      status: response.statusCode,
      durationMs: Math.round(performance.now() - startedAt)
    });
  });

  next();
}
