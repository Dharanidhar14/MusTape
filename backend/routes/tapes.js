import express from "express";
import rateLimit from "express-rate-limit";
import { createTape, deleteTape, getTape, updateTape } from "../controllers/tapeController.js";
import { uploadLocalSongs } from "../middleware/upload.js";
import { optionalAuth } from "../middleware/optionalAuth.js";
import { createHttpError } from "../services/errors.js";

const router = express.Router();

const strictLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many tape actions. Please try again later.", code: "MUSTAPE_RATE_LIMIT" }
});

const uploadMiddleware = uploadLocalSongs.array("localFiles", 24);

function handleUpload(request, response, next) {
  uploadMiddleware(request, response, (error) => {
    if (error) {
      if (error.code === "LIMIT_FILE_SIZE") {
        return next(createHttpError("A file is too large to be placed on the tape.", 400));
      }
      if (error.code === "LIMIT_FILE_COUNT" || error.code === "LIMIT_UNEXPECTED_FILE") {
        return next(createHttpError("Too many files were uploaded.", 400));
      }
      return next(createHttpError(error.message, 400));
    }
    next();
  });
}

router.post("/", strictLimiter, optionalAuth, handleUpload, createTape);
router.put("/:shareId", strictLimiter, optionalAuth, handleUpload, updateTape);
router.delete("/:shareId", strictLimiter, optionalAuth, deleteTape);
router.get("/:shareId", getTape);

export default router;
