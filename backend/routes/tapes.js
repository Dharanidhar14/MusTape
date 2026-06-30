import express from "express";
import { createTape, getTape, updateTape } from "../controllers/tapeController.js";
import { uploadLocalSongs } from "../middleware/upload.js";

const router = express.Router();

router.post("/", uploadLocalSongs.array("localFiles", 24), createTape);
router.put("/:shareId", uploadLocalSongs.array("localFiles", 24), updateTape);
router.get("/:shareId", getTape);

export default router;
