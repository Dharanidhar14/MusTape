import { getSession } from "../services/authService.js";

const COOKIE_NAME = "mustape_session";

export async function requireAuth(req, res, next) {
  try {
    const sessionId = req.cookies[COOKIE_NAME];
    const session = await getSession(sessionId);

    if (!session) {
      return res.status(401).json({ ok: false, error: "Not authenticated" });
    }

    req.user = session;
    next();
  } catch (error) {
    next(error);
  }
}
