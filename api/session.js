const { sendJson } = require("../lib/http");
const { isAuthenticated } = require("../lib/session");

module.exports = async function handler(request, response) {
  sendJson(response, { authenticated: isAuthenticated(request) });
};
