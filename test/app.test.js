const { describe, it, beforeEach, afterEach } = require("node:test");
const assert = require("node:assert/strict");
const pkg = require("../package.json");
const logger = require("../src/ui/logger");
const { DEFAULT_LANGUAGE, setLanguage } = require("../src/i18n");
const { runBrowserSession, shutdown } = require("../src/app.js");
const { PROMPT_CLOSED } = require("../src/ui/prompt.js");
const { createTempDirs } = require("./helpers/temp-dirs.js");

const temp = createTempDirs();

// Most assertions pin English; the Spanish default is covered explicitly below.
beforeEach(() => {
  setLanguage("en");
});

afterEach(() => {
  setLanguage(DEFAULT_LANGUAGE);
  temp.cleanup();
});

function tmpDir() {
  return temp.make("app-");
}

function createPromptStub(answers) {
  let i = 0;
  return () => answers[i++];
}

/**
 * Run one capture (dry run) and return every logged line and prompt question.
 * @param {object[]} [messages] Messages the stubbed fetch returns.
 */
async function runDryCapture(messages = [{ id: "1" }, { id: "2" }]) {
  const dir = tmpDir();
  const logged = [];
  const questions = [];
  const answers = ["", "", "exit"];
  let i = 0;

  await runBrowserSession({ backupDir: dir, profileDir: dir, dryRun: true }, null, {
    launchBrowser: async () => ({
      context: { close: () => Promise.resolve() },
      page: { goto: async () => {}, evaluate: async () => null },
      session: { getToken: () => "token" },
    }),
    createPrompt: () => ({
      prompt: (question) => {
        questions.push(question);
        return answers[i++];
      },
      close: () => {},
    }),
    getChannelId: async () => "456",
    getChannelName: async () => "general",
    fetchAllMessages: async () => messages,
    logger: {
      info: (message) => logged.push(String(message)),
      error: () => {},
      warn: () => {},
      debug: () => {},
      write: () => {},
    },
  });

  return { output: logged.join("\n"), questions };
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

  it("also exits when the user types 'salir', case-insensitively", async () => {
    const dir = tmpDir();
    let closed = false;

    await runBrowserSession({ backupDir: dir, profileDir: dir }, null, {
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
      createPrompt: () => ({ prompt: createPromptStub(["SALIR"]), close: () => {} }),
      saveChannel: async () => {},
      logger: { info: () => {}, error: () => {}, warn: () => {}, debug: () => {}, write: () => {} },
    });

    assert.equal(closed, true);
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
    assert.ok(logged.some((msg) => String(msg).includes("Dry run: would back up 1 message.")));
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

describe("runBrowserSession language", () => {
  it("prints the session text and prompts in English when selected", async () => {
    const { output, questions } = await runDryCapture();

    assert.match(output, new RegExp(`Discord Channel Dump  v${pkg.version} \\(API mode\\)`));
    assert.match(output, /Profile:/);
    assert.match(output, /Log in to Discord if prompted\./);
    assert.match(output, /Then navigate to any channel and press ENTER\./);
    assert.match(output, /Channel ID: 456/);
    assert.match(output, /Channel name: "general"/);
    assert.match(output, /Dry run: would back up 2 messages\./);
    assert.match(output, /Done\./);
    assert.deepEqual(questions, [
      '  > ENTER to capture | "exit" to quit: ',
      "  > Confirm (ENTER) or type a custom name: ",
      '  > ENTER to capture | "exit" to quit: ',
    ]);
  });

  it("prints the session text and prompts in Spanish by default", async () => {
    setLanguage(DEFAULT_LANGUAGE);
    const { output, questions } = await runDryCapture();

    assert.match(output, new RegExp(`Discord Channel Dump  v${pkg.version} \\(modo API\\)`));
    assert.match(output, /Perfil:/);
    assert.match(output, /Inicie sesión en Discord si se le solicita\./);
    assert.match(output, /presione ENTER\./);
    assert.match(output, /ID del canal: 456/);
    assert.match(output, /Nombre del canal: "general"/);
    assert.match(output, /Simulación: se respaldarían 2 mensajes\./);
    assert.match(output, /Listo\./);
    assert.doesNotMatch(output, /Channel ID|Dry run|Done\./);
    assert.deepEqual(questions, [
      '  > ENTER para capturar | "salir" para terminar: ',
      "  > Confirme (ENTER) o escriba un nombre personalizado: ",
      '  > ENTER para capturar | "salir" para terminar: ',
    ]);
  });

  it("uses the singular Spanish dry-run summary for one message by default", async () => {
    setLanguage(DEFAULT_LANGUAGE);
    const { output } = await runDryCapture([{ id: "1" }]);

    assert.match(output, /Simulación: se respaldaría 1 mensaje./);
    assert.doesNotMatch(output, /respaldarían|mensajes/);
  });

  for (const [language, shownWord] of [
    ["en", "exit"],
    ["es", "salir"],
  ]) {
    for (const typedWord of ["exit", "salir"]) {
      it(`shows "${shownWord}" in the ${language} capture prompt and quits on "${typedWord}"`, async () => {
        setLanguage(language);
        const dir = tmpDir();
        const questions = [];
        let closed = false;
        let saves = 0;

        await runBrowserSession({ backupDir: dir, profileDir: dir }, null, {
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
            prompt: (question) => {
              questions.push(question);
              if (questions.length > 1) throw new Error(`"${typedWord}" did not quit`);
              return typedWord;
            },
            close: () => {},
          }),
          saveChannel: async () => {
            saves++;
          },
          logger: {
            info: () => {},
            error: () => {},
            warn: () => {},
            debug: () => {},
            write: () => {},
          },
        });

        assert.equal(questions.length, 1, questions.join("\n"));
        assert.ok(questions[0].includes(`"${shownWord}"`), questions[0]);
        assert.equal(closed, true);
        assert.equal(saves, 0);
      });
    }
  }

  it("warns about a missing token in Spanish by default", async () => {
    setLanguage(DEFAULT_LANGUAGE);
    const dir = tmpDir();
    const logged = [];

    await runBrowserSession({ backupDir: dir, profileDir: dir }, null, {
      launchBrowser: async () => ({
        context: { close: () => Promise.resolve() },
        page: { goto: async () => {}, evaluate: async () => null },
        session: { getToken: () => null },
      }),
      createPrompt: () => ({ prompt: createPromptStub(["", "exit"]), close: () => {} }),
      logger: {
        info: (message) => logged.push(String(message)),
        error: () => {},
        warn: () => {},
        debug: () => {},
        write: () => {},
      },
    });

    assert.ok(logged.some((message) => message.includes("Aún no se capturó el token")));
  });

  it("writes the shutdown message in the active language", async () => {
    const dir = tmpDir();
    const written = [];
    const originalWrite = logger.write;
    logger.write = (text) => written.push(String(text));
    try {
      await shutdown("SIGINT", null, dir);
      setLanguage("es");
      await shutdown("SIGINT", null, dir);
    } finally {
      logger.write = originalWrite;
    }

    assert.equal(written[0], "\n  [SIGINT] Cancelling and cleaning up…\n");
    assert.equal(written[1], "\n  [SIGINT] Cancelando y limpiando…\n");
  });
});
