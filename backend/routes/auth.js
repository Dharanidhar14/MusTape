import express from "express";
import { verifyGoogleToken, createSession, getSession, destroySession } from "../services/authService.js";

const router = express.Router();

const COOKIE_NAME = "mustape_session";

const cookieOptions = {
  httpOnly: true,
  secure: true, // Requires HTTPS (or trust proxy)
  sameSite: "none", // Required for cross-origin Vercel <-> Render
  maxAge: 30 * 24 * 60 * 60 * 1000 // 30 days
};

router.post("/google", async (req, res, next) => {
  try {
    const { credential } = req.body;
    const googleUser = await verifyGoogleToken(credential);
    const session = await createSession(googleUser);

    res.cookie(COOKIE_NAME, session.id, cookieOptions);
    
    res.json({
      ok: true,
      user: {
        id: session.googleSub,
        name: session.name,
        email: session.email,
        picture: session.picture
      }
    });
  } catch (error) {
    next(error);
  }
});

router.get("/me", async (req, res, next) => {
  try {
    const sessionId = req.cookies[COOKIE_NAME];
    const session = await getSession(sessionId);

    if (!session) {
      return res.status(401).json({ ok: false, error: "Not authenticated" });
    }

    res.json({
      ok: true,
      user: {
        id: session.googleSub,
        name: session.name,
        email: session.email,
        picture: session.picture
      }
    });
  } catch (error) {
    next(error);
  }
});

router.post("/logout", async (req, res, next) => {
  try {
    const sessionId = req.cookies[COOKIE_NAME];
    await destroySession(sessionId);
    res.clearCookie(COOKIE_NAME, cookieOptions);
    res.json({ ok: true });
  } catch (error) {
    next(error);
  }
});

export default router;
