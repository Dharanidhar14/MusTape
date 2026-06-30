export function notFound(_request, response) {
  response.status(404).json({ error: "This part of the tape could not be found." });
}

export function errorHandler(error, _request, response, _next) {
  const status = error.status || 500;
  response.status(status).json({
    error: status === 500 ? "Something slipped while sealing the tape." : error.message,
    ...(process.env.NODE_ENV === "development" ? { detail: error.message } : {})
  });
}
