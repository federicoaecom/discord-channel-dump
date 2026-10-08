const { describe, it } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("fs");
const os = require("os");
const path = require("path");
const pkg = require("../package.json");
const { runBrowserSession } = require("../src/app.js");
const { PROMPT_CLOSED } = require("../src/ui/prompt.js");

function tmpDir() {
  return fs.mkdtempSync(path.join(os.tmpdir(), "app-"));
}

function createPromptStub(answers) {
  let i = 0;
  return () => answers[i++];
}

describe("runBrowserSession", () => {
  it("exits when the user types 'exit'", async () => {
    const dir = tmpDir();
    const config = { backupDir: dir, profileDir: dir };
    let closed = false;
    const logged = [];

    const deps = {
      launchBrowser: async () => ({
        context: {
          close: () => {
            closed = true;
            return Promise.resolve();
          },
        },
        page: { goto: async () => {}, evaluate: async () => null },
        session: { getToken: () => null },
      }),
      createPrompt: () => ({
        prompt: createPromptStub(["", "", "exit"]),
        close: () => {},
      }),
      saveChannel: async () => {},
      logger: {
        info: (message) => logged.push(String(message)),
        error: () => {},
        warn: () => {},
        debug: () => {},
        write: () => {},
      },
    };

    await runBrowserSession(config, null, deps);

    assert.equal(closed, true);
    assert.ok(
      logged.some((message) => message.includes(`Discord Channel Dump  v${pkg.version} (API mode)`))
    );
  });

  it("processes a channel when the user presses enter", async () => {
    const dir = tmpDir();
    const config = { backupDir: dir, profileDir: dir };
    const saved = [];
    let closed = false;

    const deps = {
      launchBrowser: async () => ({
        context: {
          close: () => {
            closed = true;
            return Promise.resolve();
          },
        },
        page: { goto: async () => {}, evaluate: async () => null },
        session: { getToken: () => "token" },
      }),
      createPrompt: () => ({
        prompt: createPromptStub(["", "", "exit"]),
        close: () => {},
      }),
      getChannelId: async () => "456",
      getChannelName: async () => "general",
      saveChannel: async (channelName, messages, cfg) => {
        saved.push({ channelName, messages, cfg });
        return { messageCount: messages.length };
      },
      fetchAllMessages: async () => [{ id: "1", content: "hi" }],
    };

    await runBrowserSession(config, null, deps);

    assert.equal(saved.length, 1);
    assert.equal(saved[0].channelName, "general");
    assert.equal(saved[0].messages.length, 1);
    assert.equal(closed, true);
  });

  it("warns when the token is not captured yet", async () => {
    const dir = tmpDir();
    const config = { backupDir: dir, profileDir: dir };
    let closed = false;
    const warnings = [];

    const deps = {
      launchBrowser: async () => ({
        context: {
          close: () => {
            closed = true;
            return Promise.resolve();
          },
        },
        page: { goto: async () => {}, evaluate: async () => null },
        session: { getToken: () => null },
      }),
      createPrompt: () => ({
        prompt: createPromptStub(["", "exit"]),
        close: () => {},
      }),
      logger: {
        info: (msg) => warnings.push(msg),
        error: (msg) => warnings.push(msg),
        warn: (msg) => warnings.push(msg),
        debug: () => {},
        write: () => {},
      },
    };

    await runBrowserSession(config, null, deps);

    assert.equal(closed, true);
    assert.ok(warnings.some((w) => String(w).includes("Token not captured yet")));
  });

  it("warns when the channel ID cannot be detected", async () => {
    const dir = tmpDir();
    const config = { backupDir: dir, profileDir: dir };
    let closed = false;
    const warnings = [];

    const deps = {
      launchBrowser: async () => ({
        context: {
          close: () => {
            closed = true;
            return Promise.resolve();
          },
        },
        page: { goto: async () => {}, evaluate: async () => null },
        session: { getToken: () => "token" },
      }),
      createPrompt: () => ({
        prompt: createPromptStub(["", "exit"]),
        close: () => {},
      }),
      getChannelId: async () => null,
      logger: {
        info: (msg) => warnings.push(msg),
        error: (msg) => warnings.push(msg),
        warn: (msg) => warnings.push(msg),
        debug: () => {},
        write: () => {},
      },
    };

    await runBrowserSession(config, null, deps);

    assert.equal(closed, true);
    assert.ok(warnings.some((w) => String(w).includes("Could not detect channel ID")));
  });

  it("uses a custom channel name when the user provides one", async () => {
    const dir = tmpDir();
    const config = { backupDir: dir, profileDir: dir };
    const saved = [];

    const deps = {
      launchBrowser: async () => ({
        context: { close: () => Promise.resolve() },
        page: { goto: async () => {}, evaluate: async () => null },
        session: { getToken: () => "token" },
      }),
      createPrompt: () => ({
        prompt: createPromptStub(["", "custom-name", "exit"]),
        close: () => {},
      }),
      getChannelId: async () => "456",
      getChannelName: async () => "general",
      saveChannel: async (channelName, messages) => {
        saved.push({ channelName, messages });
        return { messageCount: messages.length };
      },
      fetchAllMessages: async () => [{ id: "1", content: "hi" }],
    };

    await runBrowserSession(config, null, deps);

    assert.equal(saved.length, 1);
    assert.equal(saved[0].channelName, "custom-name");
  });

  it("skips saving when dryRun is enabled", async () => {
    const dir = tmpDir();
    const config = { backupDir: dir, profileDir: dir, dryRun: true };
    const saved = [];
    const logged = [];

    const deps = {
      launchBrowser: async () => ({
        context: { close: () => Promise.resolve() },
        page: { goto: async () => {}, evaluate: async () => null },
        session: { getToken: () => "token" },
      }),
      createPrompt: () => ({
        prompt: createPromptStub(["", "", "exit"]),
        close: () => {},
      }),
      getChannelId: async () => "456",
      getChannelName: async () => "general",
      saveChannel: async (channelName, messages) => {
        saved.push({ channelName, messages });
        return { messageCount: messages.length };
      },
      fetchAllMessages: async () => [{ id: "1", content: "hi" }],
      logger: {
        info: (msg) => logged.push(msg),
        error: () => {},
        warn: () => {},
        debug: () => {},
        write: () => {},
      },
    };

    await runBrowserSession(config, null, deps);

    assert.equal(saved.length, 0);
    assert.ok(logged.some((msg) => String(msg).includes("Dry run")));
  });

  function closingPromptDeps(promptError, onContextClose) {
    return {
      launchBrowser: async () => ({
        context: {
          close: () => {
            onContextClose();
            return Promise.resolve();
          },
        },
        page: { goto: async () => {}, evaluate: async () => null },
        session: { getToken: () => null },
      }),
      createPrompt: () => ({
        prompt: async () => {
          throw promptError;
        },
        close: () => {},
      }),
      saveChannel: async () => {},
      logger: {
        info: () => {},
        error: () => {},
        warn: () => {},
        debug: () => {},
        write: () => {},
      },
    };
  }

  it("ends the session quietly when the prompt closes, regardless of the message", async () => {
    const dir = tmpDir();
    const config = { backupDir: dir, profileDir: dir };
    let closed = false;
    const promptError = new Error("Entrada cerrada");
    promptError.code = PROMPT_CLOSED;

    await runBrowserSession(
      config,
      null,
      closingPromptDeps(promptError, () => {
        closed = true;
      })
    );

    assert.equal(closed, true);
  });

  it("propagates a generic error even when its message reads 'Prompt closed'", async () => {
    const dir = tmpDir();
    const config = { backupDir: dir, profileDir: dir };
    let closed = false;
    const promptError = new Error("Prompt closed");

    await assert.rejects(
      runBrowserSession(
        config,
        null,
        closingPromptDeps(promptError, () => {
          closed = true;
        })
      ),
      (error) => error === promptError
    );
    assert.equal(closed, true);
  });
});
