"use strict";

const fs = require("fs");
const os = require("os");
const path = require("path");
const { startServer } = require("./fixture-server");
const { saveChannel } = require("../../src/output/writer");
const { createCancelToken } = require("../../src/cancel-token");
const { loadConfig } = require("../../src/config");
const { shutdown } = require("../../src/app");

async function main() {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "interrupt-"));
  const cfg = loadConfig({
    backupDir: tmpDir,
    profileDir: path.join(tmpDir, "profile"),
    apiDelayMs: 0,
    downloadTimeoutMs: 5000,
    maxRetries: 0,
    retryDelayMs: 10,
    jitterMaxMs: 0,
  });

  const server = await startServer(0, [
    {
      path: "/slow-file",
      handler(req, res) {
        res.writeHead(200, {
          "Content-Type": "application/octet-stream",
          "Transfer-Encoding": "chunked",
        });
        res.write("x");
        const interval = setInterval(() => res.write("x"), 100);
        req.on("close", () => clearInterval(interval));
        req.on("error", () => clearInterval(interval));
      },
    },
  ]);
  const port = server.address().port;

  const messages = [
    {
      id: "1",
      content: "message",
      author: { username: "user" },
      timestamp: "2024-01-01T00:00:00.000Z",
      attachments: [{ filename: "slow-file.png", url: `http://localhost:${port}/slow-file` }],
      embeds: [],
    },
  ];

  const partPath = path.join(tmpDir, "test", "attachments", "slow-file.part");
  console.log(`server-port ${port}`);
  console.log(`.part path: ${partPath}`);

  const cancelToken = createCancelToken();

  // Windows does not deliver SIGINT to a spawned Node process in a way that
  // runs the JS handler, so trigger the same shutdown path over IPC.
  process.on("message", async (msg) => {
    if (msg === "interrupt") {
      await shutdown("SIGINT", cancelToken, cfg.backupDir);
      process.exit(1);
    }
  });

  try {
    await saveChannel("test", messages, cfg, cancelToken);
  } catch (err) {
    console.error("saveChannel error:", err.message);
  } finally {
    server.close();
  }
}

main();
