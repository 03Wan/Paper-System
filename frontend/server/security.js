import {
  createHash,
  createHmac,
  randomBytes,
  scrypt as nodeScrypt,
  timingSafeEqual
} from "node:crypto";
import { promisify } from "node:util";

const scrypt = promisify(nodeScrypt);

export const SESSION_COOKIE = "paperhelper_session";
export const SESSION_MAX_AGE_SECONDS = 12 * 60 * 60;

const SCRYPT_PREFIX = "scrypt";
const SCRYPT_N = 16384;
const SCRYPT_R = 8;
const SCRYPT_P = 1;
const SCRYPT_KEY_LENGTH = 64;

function encodeBase64Url(value) {
  return Buffer.from(value).toString("base64url");
}

function decodeBase64Url(value) {
  return Buffer.from(value, "base64url");
}

function safeEqual(left, right) {
  const a = Buffer.isBuffer(left) ? left : Buffer.from(String(left));
  const b = Buffer.isBuffer(right) ? right : Buffer.from(String(right));
  return a.length === b.length && timingSafeEqual(a, b);
}

export function assertSessionSecret(secret) {
  if (Buffer.byteLength(String(secret || ""), "utf8") < 32) {
    throw new Error("AUTH_TOKEN_SECRET must contain at least 32 bytes");
  }
}

export async function hashPassword(password) {
  const normalized = String(password || "");
  if (!normalized) throw new Error("Password is required");
  const salt = randomBytes(16);
  const derived = await scrypt(normalized, salt, SCRYPT_KEY_LENGTH, {
    N: SCRYPT_N,
    r: SCRYPT_R,
    p: SCRYPT_P,
    maxmem: 64 * 1024 * 1024
  });
  return [
    SCRYPT_PREFIX,
    SCRYPT_N,
    SCRYPT_R,
    SCRYPT_P,
    salt.toString("base64url"),
    Buffer.from(derived).toString("base64url")
  ].join("$");
}

export function isHashedPassword(value) {
  return String(value || "").startsWith(`${SCRYPT_PREFIX}$`);
}

export async function verifyPassword(password, storedValue) {
  const stored = String(storedValue || "");
  if (!isHashedPassword(stored)) return safeEqual(String(password || ""), stored);

  const [prefix, nRaw, rRaw, pRaw, saltRaw, hashRaw] = stored.split("$");
  const n = Number(nRaw);
  const r = Number(rRaw);
  const p = Number(pRaw);
  if (prefix !== SCRYPT_PREFIX || !n || !r || !p || !saltRaw || !hashRaw) return false;

  try {
    const expected = decodeBase64Url(hashRaw);
    const actual = await scrypt(String(password || ""), decodeBase64Url(saltRaw), expected.length, {
      N: n,
      r,
      p,
      maxmem: 64 * 1024 * 1024
    });
    return safeEqual(Buffer.from(actual), expected);
  } catch {
    return false;
  }
}

export function createSessionToken(userId, secret, nowMs = Date.now()) {
  assertSessionSecret(secret);
  const now = Math.floor(nowMs / 1000);
  const payload = encodeBase64Url(JSON.stringify({
    sub: String(userId),
    iat: now,
    exp: now + SESSION_MAX_AGE_SECONDS,
    nonce: randomBytes(12).toString("base64url")
  }));
  const signature = createHmac("sha256", secret).update(payload).digest("base64url");
  return `${payload}.${signature}`;
}

export function verifySessionToken(token, secret, nowMs = Date.now()) {
  try {
    assertSessionSecret(secret);
    const [payloadRaw, signatureRaw, extra] = String(token || "").split(".");
    if (!payloadRaw || !signatureRaw || extra) return null;
    const expected = createHmac("sha256", secret).update(payloadRaw).digest("base64url");
    if (!safeEqual(signatureRaw, expected)) return null;
    const payload = JSON.parse(decodeBase64Url(payloadRaw).toString("utf8"));
    const now = Math.floor(nowMs / 1000);
    const userId = Number(payload.sub);
    if (!Number.isSafeInteger(userId) || userId <= 0 || Number(payload.exp) <= now || Number(payload.iat) > now + 60) {
      return null;
    }
    return { userId, issuedAt: Number(payload.iat), expiresAt: Number(payload.exp) };
  } catch {
    return null;
  }
}

export function parseCookies(header) {
  return String(header || "").split(";").reduce((result, part) => {
    const index = part.indexOf("=");
    if (index <= 0) return result;
    const key = part.slice(0, index).trim();
    const value = part.slice(index + 1).trim();
    try {
      result[key] = decodeURIComponent(value);
    } catch {
      result[key] = value;
    }
    return result;
  }, {});
}

export function sessionCookie(token, secure = true) {
  const parts = [
    `${SESSION_COOKIE}=${encodeURIComponent(token)}`,
    "Path=/",
    "HttpOnly",
    "SameSite=Lax",
    `Max-Age=${SESSION_MAX_AGE_SECONDS}`
  ];
  if (secure) parts.push("Secure");
  return parts.join("; ");
}

export function clearSessionCookie(secure = true) {
  const parts = [
    `${SESSION_COOKIE}=`,
    "Path=/",
    "HttpOnly",
    "SameSite=Lax",
    "Max-Age=0",
    "Expires=Thu, 01 Jan 1970 00:00:00 GMT"
  ];
  if (secure) parts.push("Secure");
  return parts.join("; ");
}

export function isSecureRequest(req) {
  const proto = String(req.headers["x-forwarded-proto"] || "").split(",")[0].trim().toLowerCase();
  return proto ? proto === "https" : process.env.NODE_ENV === "production";
}

export function assertSameOrigin(req) {
  const method = String(req.method || "GET").toUpperCase();
  if (["GET", "HEAD", "OPTIONS"].includes(method)) return;
  const source = String(req.headers.origin || req.headers.referer || "").trim();
  const host = String(req.headers["x-forwarded-host"] || req.headers.host || "").split(",")[0].trim().toLowerCase();
  if (!source || !host) throw new Error("Cross-origin request rejected");
  let sourceHost = "";
  try {
    sourceHost = new URL(source).host.toLowerCase();
  } catch {
    throw new Error("Cross-origin request rejected");
  }
  if (sourceHost !== host) throw new Error("Cross-origin request rejected");
}

export function loginAttemptKey(username, ipAddress, secret) {
  assertSessionSecret(secret);
  return createHmac("sha256", secret)
    .update(`${String(username || "").trim().toLowerCase()}\n${String(ipAddress || "unknown")}`)
    .digest("hex");
}

export function contentFingerprint(value) {
  return createHash("sha256").update(String(value || "")).digest("hex");
}
