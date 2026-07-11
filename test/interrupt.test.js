const { describe, it } = require("node:test");
const assert = require("node:assert/strict");
const { spawn } = require("node:child_process");
const path = require("node:path");
const fs = require("node:fs");

const helperPath = path.resolve(__dirname, "helpers", "run-interrupt.js");

describe("safe interruption", () => {
  it("cleans up .part files and exits nonzero on SIGINT", async () => {
    const child = spawn(process.execPath, [helperPath], {
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

    let partPath = null;
    for (let i = 0; i < 50; i++) {
      const match = output.match(/\.part path: (.+)/);
      if (match) {
        partPath = match[1].trim();
        break;
      }
      await new Promise((r) => setTimeout(r, 100));
    }

    // Give the active download enough time to create the .part file.
    await new Promise((r) => setTimeout(r, 300));

    // Windows does not deliver SIGINT to a spawned Node process in a way that
    // runs the JS handler, so trigger the same handler path over IPC.
    if (process.platform === "win32") {
      child.send("interrupt");
    } else {
      child.kill("SIGINT");
    }

    const exitCode = await new Promise((resolve) => {
      child.on("close", (code) => resolve(code));
    });

    assert.notEqual(exitCode, 0, "expected nonzero exit code after SIGINT");
    if (partPath && fs.existsSync(partPath)) {
      assert.fail(`.part file still exists: ${partPath}`);
    }
  });
});
