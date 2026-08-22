import express from "express";
import { requireAuth } from "../middleware/auth.js";
import {
  createCollection,
  deleteCollection,
  getCollectionById,
  getCollections,
  updateCollection
} from "../services/collectionService.js";
import { query } from "../db/index.js";

const router = express.Router();

router.use(requireAuth);

router.post("/", async (req, res, next) => {
  try {
    // In db, user_id is referenced from the users table.
    // Our session payload currently just provides googleSub and email.
    // We need the internal user ID. Let's fetch it quickly.
    const userResult = await query("SELECT id FROM users WHERE google_sub = $1", [req.user.googleSub]);
    if (userResult.rowCount === 0) return res.status(401).json({ error: "User not found" });
    const internalUserId = userResult.rows[0].id;

    const collection = await createCollection(internalUserId, req.body);
    res.status(201).json({ ok: true, collection });
  } catch (error) {
    next(error);
  }
});

router.get("/", async (req, res, next) => {
  try {
    const userResult = await query("SELECT id FROM users WHERE google_sub = $1", [req.user.googleSub]);
    if (userResult.rowCount === 0) return res.status(401).json({ error: "User not found" });
    
    const collections = await getCollections(userResult.rows[0].id);
    res.json({ ok: true, collections });
  } catch (error) {
    next(error);
  }
});

router.get("/:id", async (req, res, next) => {
  try {
    const userResult = await query("SELECT id FROM users WHERE google_sub = $1", [req.user.googleSub]);
    if (userResult.rowCount === 0) return res.status(401).json({ error: "User not found" });

    const collection = await getCollectionById(userResult.rows[0].id, req.params.id);
    res.json({ ok: true, collection });
  } catch (error) {
    next(error);
  }
});

router.put("/:id", async (req, res, next) => {
  try {
    const userResult = await query("SELECT id FROM users WHERE google_sub = $1", [req.user.googleSub]);
    if (userResult.rowCount === 0) return res.status(401).json({ error: "User not found" });

    const collection = await updateCollection(userResult.rows[0].id, req.params.id, req.body);
    res.json({ ok: true, collection });
  } catch (error) {
    next(error);
  }
});

router.delete("/:id", async (req, res, next) => {
  try {
    const userResult = await query("SELECT id FROM users WHERE google_sub = $1", [req.user.googleSub]);
    if (userResult.rowCount === 0) return res.status(401).json({ error: "User not found" });

    await deleteCollection(userResult.rows[0].id, req.params.id);
    res.json({ ok: true });
  } catch (error) {
    next(error);
  }
});

export default router;
