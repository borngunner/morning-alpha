const { methodAllowed, readJson, sendJson } = require("../../lib/http");
const { requireSession } = require("../../lib/session");
const { analyzePortfolio } = require("../../services/reportService");

module.exports = async function handler(request, response) {
  if (!requireSession(request, response, sendJson)) return;
  if (!methodAllowed(request, response, ["POST"])) return;

  try {
    const body = await readJson(request);
    sendJson(response, {
      ok: true,
      portfolio: await analyzePortfolio(body.holdings || [])
    });
  } catch (error) {
    sendJson(response, { error: error.message }, 500);
  }
};
