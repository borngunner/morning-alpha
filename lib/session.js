const crypto = require("node:crypto");

const APP_PIN = String(process.env.APP_PIN || "0700");
const SESSION_SECRET = String(process.env.SESSION_SECRET || `morning-alpha-${APP_PIN}`);
const SESSION_COOKIE = "morning_alpha_session";

function parseCookies(request) {
  return Object.fromEntries((request.headers.cookie || "")
    .split(";")
    .map((part) => part.trim())
    .filter(Boolean)
    .map((part) => {
      const index = part.indexOf("=");
      if (index === -1) return [part, ""];
      return [part.slice(0, index), decodeURIComponent(part.slice(index + 1))];
    }));
}

function signSession(expiresAt) {
  return crypto.createHmac("sha256", SESSION_SECRET).update(String(expiresAt)).digest("hex");
}

function createSessionToken() {
  const expiresAt = Date.now() + 1000 * 60 * 60 * 24 * 14;
  return `${expiresAt}.${signSession(expiresAt)}`;
}

function isValidSessionToken(token = "") {
  const [expiresAt, signature] = token.split(".");
  if (!expiresAt || !signature || Number(expiresAt) < Date.now()) return false;
  const expected = signSession(expiresAt);
  const given = Buffer.from(signature);
  const wanted = Buffer.from(expected);
  return given.length === wanted.length && crypto.timingSafeEqual(given, wanted);
}

function isAuthenticated(request) {
  return isValidSessionToken(parseCookies(request)[SESSION_COOKIE]);
}

function equalSecret(a = "", b = "") {
  const left = Buffer.from(String(a));
  const right = Buffer.from(String(b));
  return left.length === right.length && crypto.timingSafeEqual(left, right);
}

function isPinValid(pin) {
  return equalSecret(pin, APP_PIN);
}

function cookieSecurity(request) {
  const proto = request.headers["x-forwarded-proto"] || "";
  return proto.includes("https") || process.env.VERCEL ? "; Secure" : "";
}

function setSessionCookie(request, response) {
  response.setHeader(
    "set-cookie",
    `${SESSION_COOKIE}=${encodeURIComponent(createSessionToken())}; Max-Age=1209600; Path=/; HttpOnly; SameSite=Lax${cookieSecurity(request)}`
  );
}

function clearSessionCookie(response) {
  response.setHeader("set-cookie", `${SESSION_COOKIE}=; Max-Age=0; Path=/; HttpOnly; SameSite=Lax`);
}

function requireSession(request, response, sendJson) {
  if (isAuthenticated(request)) return true;
  sendJson(response, { error: "PIN login required." }, 401);
  return false;
}

function hasAutomationSecret(request) {
  const url = new URL(request.url, "http://localhost");
  const provided = url.searchParams.get("key") || request.headers["x-morning-alpha-key"] || "";
  const secret = process.env.KAKAO_SEND_SECRET || process.env.CRON_SECRET || "";
  return Boolean(secret) && equalSecret(provided, secret);
}

module.exports = {
  clearSessionCookie,
  hasAutomationSecret,
  isAuthenticated,
  isPinValid,
  requireSession,
  setSessionCookie
};
