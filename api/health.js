const { sendJson } = require("../lib/http");

module.exports = async function handler(request, response) {
  sendJson(response, {
    ok: true,
    service: "morning-alpha-2",
    runtime: "vercel-serverless",
    time: new Date().toISOString()
  });
};
