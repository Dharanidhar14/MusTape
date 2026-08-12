import express from "express";
import { createTape, deleteTape, getTape, updateTape } from "../controllers/tapeController.js";
import { uploadLocalSongs } from "../middleware/upload.js";

const router = express.Router();

router.post("/", uploadLocalSongs.array("localFiles", 24), createTape);
router.put("/:shareId", uploadLocalSongs.array("localFiles", 24), updateTape);
router.delete("/:shareId", deleteTape);
router.get("/:shareId", getTape);

export default router;
