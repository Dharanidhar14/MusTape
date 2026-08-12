import express from "express";
import { getManageTape } from "../controllers/tapeController.js";

const router = express.Router();

// GET /api/manage/:managementToken
// Loads tape data for the management page. Returns public tape only (no token in response).
router.get("/:managementToken", getManageTape);

export default router;
