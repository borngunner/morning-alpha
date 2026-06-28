function sendJson(response, data, status = 200) {
  response.statusCode = status;
  response.setHeader("content-type", "application/json; charset=utf-8");
  response.setHeader("cache-control", "no-store");
  response.end(JSON.stringify(data));
}

function readBody(request) {
  return new Promise((resolve, reject) => {
    let body = "";
    request.on("data", (chunk) => {
      body += chunk;
      if (body.length > 100000) {
        reject(new Error("Request body too large"));
        request.destroy();
      }
    });
    request.on("end", () => resolve(body));
    request.on("error", reject);
  });
}

async function readJson(request) {
  const body = await readBody(request);
  if (!body) return {};
  return JSON.parse(body);
}

function methodAllowed(request, response, methods) {
  if (methods.includes(request.method)) return true;
  sendJson(response, { error: "Method not allowed" }, 405);
  return false;
}

module.exports = {
  methodAllowed,
  readJson,
  sendJson
};
