const { sendJson } = require("../lib/http");
const { clearSessionCookie } = require("../lib/session");

module.exports = async function handler(request, response) {
  clearSessionCookie(response);
  sendJson(response, { ok: true, authenticated: false });
};
