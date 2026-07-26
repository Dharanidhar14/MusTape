export function createHttpError(message, status = 400, code = "MUSTAPE_REQUEST_ERROR") {
  const error = new Error(message);
  error.status = status;
  error.code = code;
  return error;
}

export function fail(message, status = 400, code = "MUSTAPE_REQUEST_ERROR") {
  throw createHttpError(message, status, code);
}

export function toPublicError(error, requestId) {
  const status = Number.isInteger(error.status) ? error.status : 500;
  const isServerError = status >= 500;

  return {
    status,
    body: {
      error: isServerError ? "Something slipped while sealing the tape." : error.message,
      code: isServerError ? "MUSTAPE_INTERNAL_ERROR" : error.code || "MUSTAPE_REQUEST_ERROR",
      requestId,
      ...(process.env.NODE_ENV === "development" ? { detail: error.message } : {})
    }
  };
}
