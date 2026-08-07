import test from "node:test";
import assert from "node:assert/strict";
import {
  SESSION_COOKIE,
  assertSameOrigin,
  clearSessionCookie,
  createSessionToken,
  hashPassword,
  isHashedPassword,
  parseCookies,
  sessionCookie,
  verifyPassword,
  verifySessionToken
} from "../server/security.js";

const secret = "test-secret-that-is-at-least-thirty-two-bytes-long";

test("hashPassword creates a verifiable salted scrypt hash", async () => {
  const first = await hashPassword("correct horse battery staple");
  const second = await hashPassword("correct horse battery staple");
  assert.equal(isHashedPassword(first), true);
  assert.notEqual(first, second);
  assert.equal(await verifyPassword("correct horse battery staple", first), true);
  assert.equal(await verifyPassword("wrong password", first), false);
});

test("verifyPassword supports one-time legacy plaintext migration", async () => {
  assert.equal(await verifyPassword("legacy-password", "legacy-password"), true);
  assert.equal(await verifyPassword("other-password", "legacy-password"), false);
});

test("session tokens reject tampering and expiration", () => {
  const now = Date.UTC(2026, 7, 7, 12, 0, 0);
  const token = createSessionToken(42, secret, now);
  assert.equal(verifySessionToken(token, secret, now)?.userId, 42);
  assert.equal(verifySessionToken(`${token}x`, secret, now), null);
  assert.equal(verifySessionToken(token, secret, now + 13 * 60 * 60 * 1000), null);
});

test("session cookies are host-only, HttpOnly and clearable", () => {
  const value = sessionCookie("token", true);
  assert.match(value, new RegExp(`^${SESSION_COOKIE}=`));
  assert.match(value, /HttpOnly/);
  assert.match(value, /Secure/);
  assert.match(value, /SameSite=Lax/);
  assert.doesNotMatch(value, /Domain=/);
  assert.match(clearSessionCookie(true), /Max-Age=0/);
  assert.equal(parseCookies(`${SESSION_COOKIE}=abc%2Edef; theme=dark`)[SESSION_COOKIE], "abc.def");
});

test("unsafe requests require a same-origin source", () => {
  const valid = { method: "POST", headers: { origin: "https://paperhelper.myboverse.com", host: "paperhelper.myboverse.com" } };
  assert.doesNotThrow(() => assertSameOrigin(valid));
  assert.throws(() => assertSameOrigin({ ...valid, headers: { ...valid.headers, origin: "https://evil.example" } }));
  assert.throws(() => assertSameOrigin({ method: "POST", headers: { host: "paperhelper.myboverse.com" } }));
  assert.doesNotThrow(() => assertSameOrigin({ method: "GET", headers: {} }));
});
