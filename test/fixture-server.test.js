const { describe, it } = require("node:test");
const assert = require("node:assert/strict");
const http = require("http");
const { startServer, stopServer } = require("./helpers/fixture-server.js");

describe("fixture-server", () => {
  it("starts and stops, releasing the port", async () => {
    const server = await startServer(0, [{ path: "/ping", body: "pong" }]);
    const port = server.address().port;
    assert.ok(port > 0);

    const res = await new Promise((resolve, reject) => {
      const req = http.get(`http://localhost:${port}/ping`, resolve);
      req.on("error", reject);
    });
    let body = "";
    for await (const chunk of res) body += chunk;
    assert.equal(body, "pong");

    await stopServer(server);
    assert.equal(server.listening, false);
  });

  it("returns 404 for unmatched routes", async () => {
    const server = await startServer(0, []);
    const port = server.address().port;
    const res = await new Promise((resolve, reject) => {
      const req = http.get(`http://localhost:${port}/missing`, resolve);
      req.on("error", reject);
    });
    assert.equal(res.statusCode, 404);
    res.resume();
    await stopServer(server);
  });
});
