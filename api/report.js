const { sendJson } = require("../lib/http");
const { requireSession } = require("../lib/session");
const { getMorningReport } = require("../services/reportService");

module.exports = async function handler(request, response) {
  if (!requireSession(request, response, sendJson)) return;

  try {
    const url = new URL(request.url, "http://localhost");
    sendJson(response, await getMorningReport({ refresh: url.searchParams.get("refresh") === "1" }));
  } catch (error) {
    sendJson(response, { error: error.message }, 500);
  }
};
