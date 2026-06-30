import cors from "cors";
import express from "express";
import { paths } from "./config/paths.js";
import { serverConfig } from "./config/server.js";
import { errorHandler, notFound } from "./middleware/errorHandler.js";
import tapesRouter from "./routes/tapes.js";

const app = express();

function isAllowedOrigin(origin) {
  return (
    !origin ||
    origin === serverConfig.frontendOrigin ||
    /^http:\/\/127\.0\.0\.1:\d+$/.test(origin) ||
    /^http:\/\/localhost:\d+$/.test(origin)
  );
}

app.use(
  cors({
    origin(origin, callback) {
      if (isAllowedOrigin(origin)) {
        callback(null, true);
        return;
      }
      callback(new Error("Origin is not allowed for this MusTape studio."));
    }
  })
);

app.use(express.json({ limit: "1mb" }));
app.use("/uploads", express.static(paths.uploadDir));
app.use("/api/tapes", tapesRouter);

app.get("/health", (_request, response) => {
  response.json({ ok: true, name: "MusTape API" });
});

app.use(notFound);
app.use(errorHandler);

app.listen(serverConfig.port, () => {
  console.log(`MusTape API listening on http://localhost:${serverConfig.port}`);
});
