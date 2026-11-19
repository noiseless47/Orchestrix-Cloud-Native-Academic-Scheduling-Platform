import express, { Router } from "express";
import { OAuth2Client } from "google-auth-library";
import { issueSession, readCookie, SESSION_COOKIE_NAME, sessionCookieOptions, verifySession } from "../utils/session.js";

const router = Router();

function frontendRedirect(path) {
  const baseUrl = process.env.FRONTEND_URL || "http://localhost:3000";
  return new URL(path, baseUrl).toString();
}

router.post("/google/callback", express.urlencoded({ extended: false, limit: "16kb" }), async (req, res) => {
  const csrfCookie = readCookie(req, "g_csrf_token");
  const csrfBody = typeof req.body?.g_csrf_token === "string" ? req.body.g_csrf_token : "";
  if (!csrfCookie || !csrfBody || csrfCookie !== csrfBody) {
    return res.redirect(303, frontendRedirect("/login?error=csrf"));
  }

  const clientId = process.env.GOOGLE_CLIENT_ID;
  if (!clientId || typeof req.body?.credential !== "string") {
    return res.redirect(303, frontendRedirect("/login?error=configuration"));
  }

  try {
    const googleClient = new OAuth2Client(clientId);
    const ticket = await googleClient.verifyIdToken({ idToken: req.body.credential, audience: clientId });
    const profile = ticket.getPayload();
    if (!profile?.sub || !profile.email || profile.email_verified !== true) {
      return res.redirect(303, frontendRedirect("/login?error=account"));
    }
    const allowedDomain = process.env.GOOGLE_ALLOWED_DOMAIN?.trim().toLowerCase();
    if (allowedDomain && profile.hd?.toLowerCase() !== allowedDomain) {
      return res.redirect(303, frontendRedirect("/login?error=domain"));
    }

    const token = issueSession({ sub: profile.sub, email: profile.email, name: profile.name || profile.email, picture: profile.picture || "" });
    res.cookie(SESSION_COOKIE_NAME, token, sessionCookieOptions());
    return res.redirect(303, frontendRedirect("/dashboard"));
  } catch (error) {
    console.error("Google sign-in verification failed:", error instanceof Error ? error.message : "unknown error");
    return res.redirect(303, frontendRedirect("/login?error=verification"));
  }
});

router.get("/session", (req, res) => {
  const session = verifySession(readCookie(req, SESSION_COOKIE_NAME));
  if (!session) return res.status(401).json({ message: "Sign-in required" });
  return res.json({ user: { id: session.sub, email: session.email, name: session.name, picture: session.picture } });
});

router.post("/logout", (_req, res) => {
  res.clearCookie(SESSION_COOKIE_NAME, sessionCookieOptions());
  return res.status(204).end();
});

export default router;
