import { createHmac, timingSafeEqual } from "crypto";

export const SESSION_COOKIE_NAME = "orchestrix_session";
export const SESSION_LIFETIME_SECONDS = 8 * 60 * 60;

export function readCookie(req, name) {
  const cookie = req.headers.cookie?.split(";").map((item) => item.trim()).find((item) => item.startsWith(`${name}=`));
  if (!cookie) return "";
  try {
    return decodeURIComponent(cookie.slice(name.length + 1));
  } catch {
    return "";
  }
}

function sessionSecret() {
  const secret = process.env.JWT_SECRET;
  if (!secret || secret === "change-this-local-secret" || secret === "replace-with-a-long-random-secret") {
    throw new Error("JWT_SECRET must be configured with a private value");
  }
  return secret;
}

export function issueSession(user) {
  const issuedAt = Math.floor(Date.now() / 1000);
  const header = Buffer.from(JSON.stringify({ alg: "HS256", typ: "JWT" })).toString("base64url");
  const payload = Buffer.from(JSON.stringify({ ...user, iss: "orchestrix", iat: issuedAt, exp: issuedAt + SESSION_LIFETIME_SECONDS })).toString("base64url");
  const unsigned = `${header}.${payload}`;
  const signature = createHmac("sha256", sessionSecret()).update(unsigned).digest("base64url");
  return `${unsigned}.${signature}`;
}

export function verifySession(token) {
  if (!token) return null;
  try {
    const [header, payload, signature, extra] = token.split(".");
    if (!header || !payload || !signature || extra) return null;
    const expected = createHmac("sha256", sessionSecret()).update(`${header}.${payload}`).digest();
    const received = Buffer.from(signature, "base64url");
    if (expected.length !== received.length || !timingSafeEqual(expected, received)) return null;
    const claims = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
    if (claims.iss !== "orchestrix" || typeof claims.exp !== "number" || claims.exp <= Date.now() / 1000 || !claims.sub || !claims.email) return null;
    return claims;
  } catch {
    return null;
  }
}

export function sessionCookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.COOKIE_SECURE === "true" || (process.env.COOKIE_SECURE !== "false" && process.env.NODE_ENV === "production"),
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_LIFETIME_SECONDS * 1000,
  };
}
