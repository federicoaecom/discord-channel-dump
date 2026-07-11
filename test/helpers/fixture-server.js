/**
 * Local HTTP fixture server for deterministic downloader and interrupt tests.
 */

"use strict";

const http = require("http");

function sendResponse(res, status, body, headers = {}) {
  const safeHeaders = { ...headers };
  delete safeHeaders["content-length"];
  const buf = Buffer.isBuffer(body) ? body : Buffer.from(String(body ?? ""), "utf8");
  res.writeHead(status, { ...safeHeaders, "Content-Length": String(buf.length) });
  res.end(buf);
}

/**
 * Start a local HTTP server.
 *
 * @param {number} port - 0 for any available port.
 * @param {Array} routes - Route definitions. Each route may define:
 *   - path {string|RegExp}
 *   - method {string} default GET
 *   - count {number} match only the nth request to this path/method
 *   - status {number}
 *   - body {string|Buffer}
 *   - headers {object}
 *   - delayMs {number}
 *   - redirectTo {string}
 *   - handler {function(req, res)} - overrides all response logic
 */
async function startServer(port, routes) {
  const requestCounts = new Map();

  const server = http.createServer((req, res) => {
    const key = `${req.method} ${req.url}`;
    requestCounts.set(key, (requestCounts.get(key) || 0) + 1);
    const count = requestCounts.get(key);

    const route = (routes || []).find((r) => {
      const pathMatches = typeof r.path === "string" ? req.url === r.path : r.path.test(req.url);
      const methodMatches = req.method.toUpperCase() === (r.method || "GET").toUpperCase();
      const countMatches = r.count === undefined || r.count === count;
      return pathMatches && methodMatches && countMatches;
    });

    if (!route) {
      res.statusCode = 404;
      res.end("Not Found");
      return;
    }

    if (typeof route.handler === "function") {
      route.handler(req, res);
      return;
    }

    function respond() {
      if (route.redirectTo) {
        res.writeHead(302, { Location: route.redirectTo });
        res.end();
        return;
      }
      sendResponse(res, route.status ?? 200, route.body ?? "", route.headers);
    }

    if (route.delayMs) {
      setTimeout(respond, route.delayMs);
    } else {
      respond();
    }
  });

  await new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(port || 0, () => {
      server.removeListener("error", reject);
      resolve();
    });
  });

  return server;
}

function stopServer(server) {
  return new Promise((resolve) => {
    server.close(() => resolve());
  });
}

module.exports = { startServer, stopServer };
