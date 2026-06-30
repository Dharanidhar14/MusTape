import express from "express";
import { createTape, getTape } from "../controllers/tapeController.js";
import { uploadLocalSongs } from "../middleware/upload.js";

const router = express.Router();

router.post("/", uploadLocalSongs.array("localFiles", 24), createTape);
router.get("/:shareId", getTape);

export default router;
