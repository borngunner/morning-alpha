const { sendJson } = require("../../lib/http");
const { requireSession } = require("../../lib/session");
const { getKakaoStatus } = require("../../services/kakaoService");

module.exports = async function handler(request, response) {
  if (!requireSession(request, response, sendJson)) return;
  sendJson(response, getKakaoStatus());
};
