import cors from "cors";
import express from "express";
import { paths } from "./config/paths.js";
import { serverConfig } from "./config/server.js";
import { errorHandler, notFound } from "./middleware/errorHandler.js";
import { requestLogger } from "./middleware/requestLogger.js";
import tapesRouter from "./routes/tapes.js";
import { logger } from "./services/logger.js";

const app = express();

function isAllowedOrigin(origin) {
  return (
    !origin ||
    serverConfig.allowedOrigins.includes(origin) ||
    (serverConfig.nodeEnv !== "production" &&
      (/^http:\/\/127\.0\.0\.1:\d+$/.test(origin) ||
        /^http:\/\/localhost:\d+$/.test(origin)))
  );
}

app.set("trust proxy", 1);
app.use(requestLogger);
app.use(
  cors({
    origin(origin, callback) {
      if (isAllowedOrigin(origin)) {
        callback(null, true);
        return;
      }
      callback(
        Object.assign(new Error("Origin is not allowed for this MusTape studio."), {
          status: 403,
          code: "MUSTAPE_ORIGIN_NOT_ALLOWED"
        })
      );
    }
  })
);

app.use(express.json({ limit: serverConfig.jsonLimit }));
app.use("/uploads", express.static(paths.uploadDir));
app.use("/api/tapes", tapesRouter);

app.get("/health", (_request, response) => {
  response.json({ ok: true, name: "MusTape API" });
});

app.use(notFound);
app.use(errorHandler);

app.listen(serverConfig.port, () => {
  logger.info("server.ready", {
    port: serverConfig.port,
    environment: serverConfig.nodeEnv,
    maxSongs: serverConfig.maxSongs,
    maxUploadSizeMb: Math.round(serverConfig.maxUploadSize / 1024 / 1024)
  });
});
