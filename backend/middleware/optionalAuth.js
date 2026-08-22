import { getSession } from "../services/authService.js";

const COOKIE_NAME = "mustape_session";

export async function optionalAuth(req, res, next) {
  try {
    const sessionId = req.cookies?.[COOKIE_NAME];
    if (sessionId) {
      const session = await getSession(sessionId);
      if (session) {
        req.user = session;
      }
    }
    next();
  } catch (error) {
    next();
  }
}
