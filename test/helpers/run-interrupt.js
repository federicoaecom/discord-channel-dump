"use strict";

const { createHash } = require("crypto");
const fs = require("fs");
const os = require("os");
const path = require("path");
const { startServer } = require("./fixture-server");
const { saveChannel } = require("../../src/output/writer");
const { createCancelToken } = require("../../src/cancel-token");
const { loadConfig } = require("../../src/config");
const { registerShutdown } = require("../../src/app");

function waitForFile(filePath, timeoutMs) {
  return new Promise((resolve, reject) => {
    const directory = path.dirname(filePath);
    const filename = path.basename(filePath);
    let watcher;
    let timeout;

    const finish = (error) => {
      clearTimeout(timeout);
      watcher?.close();
      if (error) reject(error);
      else resolve();
    };

    const check = () => {
      if (fs.existsSync(filePath)) finish();
    };

    watcher = fs.watch(directory, (_eventType, changedFilename) => {
      if (!changedFilename || changedFilename.toString() === filename) check();
    });
    timeout = setTimeout(
      () => finish(new Error(`Timed out waiting for active download: ${filePath}`)),
      timeoutMs
    );
    check();
  });
}

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
  const slowFileUrl = `http://localhost:${port}/slow-file`;

  const messages = [
    {
      id: "1",
      content: "message",
      author: { username: "user" },
      timestamp: "2024-01-01T00:00:00.000Z",
      attachments: [{ filename: "slow-file.png", url: slowFileUrl }],
      embeds: [],
    },
  ];

  const sourceHash = createHash("sha256").update(slowFileUrl).digest("hex");
  const partPath = path.join(tmpDir, "test", "attachments", `slow-file_${sourceHash}.part`);
  console.log(`server-port ${port}`);
  console.log(`.part path: ${partPath}`);

  const cancelToken = createCancelToken();
  registerShutdown(cancelToken, cfg);

  // Windows does not deliver SIGINT to a spawned Node process in a way that
  // runs the JS handler, so emit it through the IPC test bridge.
  process.on("message", (msg) => {
    if (msg === "interrupt") process.emit("SIGINT");
  });

  try {
    const savePromise = saveChannel("test", messages, cfg, cancelToken);
    await Promise.race([
      waitForFile(partPath, 5000),
      savePromise.then(() => {
        throw new Error("Download completed before interruption was ready");
      }),
    ]);
    process.send?.({ type: "part-ready", partPath, tmpDir });
    await savePromise;
  } catch (err) {
    console.error("saveChannel error:", err.message);
  } finally {
    server.close();
    if (process.connected) process.disconnect();
  }
}

main();
