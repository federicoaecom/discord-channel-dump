const { describe, it } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("fs");
const os = require("os");
const path = require("path");
const { startServer, stopServer } = require("./helpers/fixture-server.js");
const { downloadFile } = require("../src/downloader.js");
const { createCancelToken } = require("../src/cancel-token.js");

const baseOpts = {
  maxRetries: 2,
  retryDelayMs: 10,
  jitterMaxMs: 0,
  timeoutMs: 5000,
};

function tmpDir() {
  return fs.mkdtempSync(path.join(os.tmpdir(), "dl-"));
}

describe("downloadFile", () => {
  it("follows a relative redirect and returns the target file", async () => {
    const dir = tmpDir();
    const server = await startServer(0, [
      { path: "/redirect", redirectTo: "/target" },
      { path: "/target", body: "target-body" },
    ]);
    const port = server.address().port;
    const dest = path.join(dir, "file.txt");

    await downloadFile(`http://localhost:${port}/redirect`, dest, baseOpts);

    assert.equal(fs.readFileSync(dest, "utf8"), "target-body");
    assert.equal(
      fs.readdirSync(dir).some((f) => f.endsWith(".part")),
      false
    );
    await stopServer(server);
  });

  it("stops after maxRedirects and cleans up the .part file", async () => {
    const dir = tmpDir();
    const server = await startServer(0, [{ path: "/loop", redirectTo: "/loop" }]);
    const port = server.address().port;
    const dest = path.join(dir, "file.txt");

    await assert.rejects(
      downloadFile(`http://localhost:${port}/loop`, dest, { ...baseOpts, maxRedirects: 2 }),
      /Too many redirects/
    );
    assert.equal(fs.readdirSync(dir).length, 0);
    await stopServer(server);
  });

  it("retries 503 twice then succeeds", async () => {
    const dir = tmpDir();
    let count = 0;
    const server = await startServer(0, [
      {
        path: "/flaky",
        handler(req, res) {
          count++;
          if (count <= 2) {
            res.writeHead(503);
            res.end("error");
          } else {
            res.writeHead(200);
            res.end("ok");
          }
        },
      },
    ]);
    const port = server.address().port;
    const dest = path.join(dir, "file.txt");

    await downloadFile(`http://localhost:${port}/flaky`, dest, baseOpts);

    assert.equal(fs.readFileSync(dest, "utf8"), "ok");
    assert.equal(count, 3);
    await stopServer(server);
  });

  it("retries 429 then succeeds", async () => {
    const dir = tmpDir();
    let count = 0;
    const server = await startServer(0, [
      {
        path: "/rate",
        handler(req, res) {
          count++;
          if (count === 1) {
            res.writeHead(429);
            res.end("rate");
          } else {
            res.writeHead(200);
            res.end("data");
          }
        },
      },
    ]);
    const port = server.address().port;
    const dest = path.join(dir, "rate.txt");

    await downloadFile(`http://localhost:${port}/rate`, dest, baseOpts);

    assert.equal(fs.readFileSync(dest, "utf8"), "data");
    assert.equal(count, 2);
    await stopServer(server);
  });

  it("fails on 404 without retrying", async () => {
    const dir = tmpDir();
    let count = 0;
    const server = await startServer(0, [
      {
        path: "/missing",
        handler(req, res) {
          count++;
          res.writeHead(404);
          res.end("not found");
        },
      },
    ]);
    const port = server.address().port;
    const dest = path.join(dir, "missing.txt");

    await assert.rejects(
      downloadFile(`http://localhost:${port}/missing`, dest, baseOpts),
      /HTTP 404/
    );
    assert.equal(count, 1);
    assert.equal(fs.existsSync(dest), false);
    assert.equal(fs.readdirSync(dir).length, 0);
    await stopServer(server);
  });

  it("cleans up .part when the response stream aborts", async () => {
    const dir = tmpDir();
    const server = await startServer(0, [
      {
        path: "/abort",
        handler(req, res) {
          res.writeHead(200, { "Content-Length": "100" });
          res.write("partial");
          setTimeout(() => req.socket.destroy(), 50);
        },
      },
    ]);
    const port = server.address().port;
    const dest = path.join(dir, "abort.txt");

    await assert.rejects(
      downloadFile(`http://localhost:${port}/abort`, dest, baseOpts),
      /socket|ECONNRESET|aborted/i
    );
    assert.equal(fs.existsSync(dest), false);
    assert.equal(fs.readdirSync(dir).length, 0);
    await stopServer(server);
  });

  it("throws immediately when the cancel token is already cancelled", async () => {
    const dir = tmpDir();
    const server = await startServer(0, [{ path: "/file", body: "x" }]);
    const port = server.address().port;
    const token = createCancelToken();
    token.cancel();
    const dest = path.join(dir, "cancel.txt");

    await assert.rejects(
      downloadFile(`http://localhost:${port}/file`, dest, { ...baseOpts, cancelToken: token }),
      /Cancelled/
    );
    await stopServer(server);
  });
});
