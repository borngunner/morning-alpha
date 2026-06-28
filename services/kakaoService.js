const core = require("./morningAlphaCore.cjs");

function getKakaoStatus() {
  return core.kakaoConfigStatus();
}

async function sendTodaySummary({ refresh = false, oncePerDay = false } = {}) {
  return core.sendKakaoTodayBriefing(refresh, oncePerDay);
}

function summarizeReport(report) {
  return core.summarizeNewsForKakao(report);
}

module.exports = {
  getKakaoStatus,
  sendTodaySummary,
  summarizeReport
};
