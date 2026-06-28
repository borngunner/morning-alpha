const { sendJson } = require("../../lib/http");
const { hasAutomationSecret } = require("../../lib/session");
const { generateMorningReport } = require("../../services/reportService");
const { sendTodaySummary } = require("../../services/kakaoService");

module.exports = async function handler(request, response) {
  const isVercelCron = Boolean(request.headers["x-vercel-cron"]);
  if (!isVercelCron && !hasAutomationSecret(request)) {
    sendJson(response, { error: "Cron secret required." }, 401);
    return;
  }

  try {
    const report = await generateMorningReport();
    let kakao = { skipped: true, reason: "KAKAO_DAILY_SEND is not enabled." };
    if (process.env.KAKAO_DAILY_SEND === "1") {
      kakao = await sendTodaySummary({ refresh: false, oncePerDay: true });
    }
    sendJson(response, {
      ok: true,
      generatedAt: report.generatedAt,
      kakao
    });
  } catch (error) {
    sendJson(response, { error: error.message }, 500);
  }
};
