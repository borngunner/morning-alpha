const { methodAllowed, readJson, sendJson } = require("../lib/http");
const { isPinValid, setSessionCookie } = require("../lib/session");

module.exports = async function handler(request, response) {
  if (!methodAllowed(request, response, ["POST"])) return;

  try {
    const body = await readJson(request);
    if (!isPinValid(body.pin)) {
      sendJson(response, { error: "PIN이 맞지 않습니다." }, 401);
      return;
    }
    setSessionCookie(request, response);
    sendJson(response, { ok: true, authenticated: true });
  } catch (error) {
    sendJson(response, { error: error.message }, 400);
  }
};
