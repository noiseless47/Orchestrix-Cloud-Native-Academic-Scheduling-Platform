import { readCookie, SESSION_COOKIE_NAME, verifySession } from "../utils/session.js";

export function requireSession(req, res, next) {
  const session = verifySession(readCookie(req, SESSION_COOKIE_NAME));
  if (!session) return res.status(401).json({ message: "Sign-in required" });
  req.user = session;
  return next();
}
