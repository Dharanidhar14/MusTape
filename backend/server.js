import fs from "node:fs/promises";
import cors from "cors";
import express from "express";
import rateLimit from "express-rate-limit";
import helmet from "helmet";
import { paths } from "./config/paths.js";
import { serverConfig } from "./config/server.js";
import { errorHandler, notFound } from "./middleware/errorHandler.js";
import { requestLogger } from "./middleware/requestLogger.js";
import manageRouter from "./routes/manage.js";
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
app.use(helmet({ crossOriginResourcePolicy: { policy: "cross-origin" } }));
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
    },
    // Allow the management token header for preflight checks on PUT/DELETE
    allowedHeaders: ["Content-Type", "X-Management-Token"],
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"]
  })
);

const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 1000,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many requests. Please try again later.", code: "MUSTAPE_RATE_LIMIT" }
});

app.use(globalLimiter);
app.use(express.json({ limit: serverConfig.jsonLimit }));
app.use("/uploads", express.static(paths.uploadDir));
app.use("/api/tapes", tapesRouter);
app.use("/api/manage", manageRouter);

app.get("/health", async (_request, response) => {
  try {
    // Only verify basic accessibility. FS throws if not found/unauthorized.
    await fs.access(paths.storageDir, fs.constants.R_OK | fs.constants.W_OK);
    await fs.access(paths.uploadDir, fs.constants.R_OK | fs.constants.W_OK);
    response.json({ ok: true, name: "MusTape API", storage: "ok" });
  } catch (error) {
    logger.error("health.storage_failed", { message: error.message });
    response.status(503).json({ ok: false, name: "MusTape API", storage: "unreachable" });
  }
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
