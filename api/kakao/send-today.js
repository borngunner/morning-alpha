const { methodAllowed, sendJson } = require("../../lib/http");
const { hasAutomationSecret, isAuthenticated } = require("../../lib/session");
const { sendTodaySummary } = require("../../services/kakaoService");

module.exports = async function handler(request, response) {
  if (!isAuthenticated(request) && !hasAutomationSecret(request)) {
    sendJson(response, { error: "PIN login or send secret required." }, 401);
    return;
  }
  if (!methodAllowed(request, response, ["POST"])) return;

  try {
    const url = new URL(request.url, "http://localhost");
    sendJson(response, await sendTodaySummary({
      refresh: url.searchParams.get("refresh") === "1",
      oncePerDay: url.searchParams.get("once") === "1"
    }));
  } catch (error) {
    sendJson(response, { error: error.message }, 500);
  }
};
