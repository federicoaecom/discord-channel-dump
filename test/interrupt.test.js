const { describe, it, afterEach } = require("node:test");
const assert = require("node:assert/strict");
const { spawn } = require("node:child_process");
const path = require("node:path");
const fs = require("node:fs");
const { createTempDirs } = require("./helpers/temp-dirs.js");

const helperPath = path.resolve(__dirname, "helpers", "run-interrupt.js");
const temp = createTempDirs();

// The test owns the helper's backup directory, so it is removed even when the
// helper fails before reporting readiness.
afterEach(() => {
  temp.cleanup();
});

function waitForReady(child, getOutput) {
  return new Promise((resolve, reject) => {
    const cleanup = () => {
      clearTimeout(timeout);
      child.off("message", onMessage);
      child.off("close", onClose);
    };
    const onMessage = (message) => {
      if (message?.type !== "part-ready") return;
      cleanup();
      resolve(message);
    };
    const onClose = (code, signal) => {
      cleanup();
      reject(
        new Error(
          `helper exited before the download became active (code=${code}, signal=${signal})\n${getOutput()}`
        )
      );
    };
    const timeout = setTimeout(() => {
      cleanup();
      reject(new Error(`timed out waiting for active download\n${getOutput()}`));
    }, 5000);

    child.on("message", onMessage);
    child.on("close", onClose);
  });
}

describe("safe interruption", () => {
  it("cleans up .part files and exits nonzero on SIGINT", async () => {
    const tmpDir = temp.make("interrupt-");
    const child = spawn(process.execPath, [helperPath, tmpDir], {
      stdio: ["ipc", "pipe", "pipe"],
    });

    let output = "";
    child.stdout.setEncoding("utf8");
    child.stdout.on("data", (d) => {
      output += d;
    });
    child.stderr.setEncoding("utf8");
    child.stderr.on("data", (d) => {
      output += d;
    });

    const closePromise = new Promise((resolve) => {
      child.once("close", (code, signal) => resolve({ code, signal }));
    });

    try {
      const ready = await waitForReady(child, () => output);
      assert.equal(fs.existsSync(ready.partPath), true, "expected an active .part file");

      // Windows cannot deliver SIGINT to the child, so use its IPC bridge to
      // emit the same signal event handled on POSIX.
      if (process.platform === "win32") child.send("interrupt");
      else child.kill("SIGINT");

      const { code, signal } = await closePromise;
      assert.equal(code, 1, `expected exit code 1 after SIGINT, received signal ${signal}`);
      assert.equal(
        fs.existsSync(ready.partPath),
        false,
        `.part file still exists: ${ready.partPath}`
      );
    } finally {
      // Wait for the child to exit so it releases files before cleanup.
      if (child.exitCode === null && child.signalCode === null) {
        child.kill();
        await closePromise;
      }
    }
  });
});
