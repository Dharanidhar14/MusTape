import { logger } from "../services/logger.js";
import { toPublicError } from "../services/errors.js";
import { safePath } from "./requestLogger.js";

export function notFound(request, response) {
  response.status(404).json({
    error: "This part of the tape could not be found.",
    code: "MUSTAPE_NOT_FOUND",
    requestId: request.id
  });
}

export function errorHandler(error, request, response, _next) {
  const { status, body } = toPublicError(error, request.id);

  logger[status >= 500 ? "error" : "warn"]("request.error", {
    requestId: request.id,
    method: request.method,
    path: safePath(request.path),
    status,
    code: body.code,
    ...(status < 500 ? { message: error.message } : { errorName: error.name, sysCode: error.code })
  });

  response.status(status).json(body);
}
