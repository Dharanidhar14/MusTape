import express from "express";
import { getManageTape } from "../controllers/tapeController.js";
import { claimTape } from "../services/tapeService.js";
import { requireAuth } from "../middleware/auth.js";
import { query } from "../db/index.js";

const router = express.Router();

// GET /api/manage/:managementToken
// Loads tape data for the management page. Returns public tape only (no token in response).
router.get("/:managementToken", getManageTape);

// POST /api/manage/:managementToken/claim
router.post("/:managementToken/claim", requireAuth, async (req, res, next) => {
  try {
    const userResult = await query("SELECT id FROM users WHERE google_sub = $1", [req.user.googleSub]);
    if (userResult.rowCount === 0) return res.status(401).json({ error: "User not found" });

    const { collectionId } = req.body;
    if (!collectionId) return res.status(400).json({ error: "collectionId is required" });

    const shareId = await claimTape(req.params.managementToken, collectionId, userResult.rows[0].id);
    res.json({ ok: true, shareId });
  } catch (error) {
    next(error);
  }
});

export default router;
