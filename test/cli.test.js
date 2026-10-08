const pkg = require("../package.json");
const { describe, it, beforeEach, afterEach } = require("node:test");
const assert = require("node:assert/strict");
const { spawnSync } = require("node:child_process");
const fs = require("node:fs");
const path = require("node:path");

const { DEFAULT_LANGUAGE, setLanguage } = require("../src/i18n");
const backupArgs = require("../src/cli/backup-args.js");
const backup = require("../bin/backup.js");
const regen = require("../bin/regen-html.js");
const { findLangFlag } = require("../src/cli/language.js");
const { createTempDirs } = require("./helpers/temp-dirs.js");

const temp = createTempDirs();

/**
 * Build a child-process environment that ignores any DISCORD_LANG set in the
 * developer's shell, optionally adding explicit overrides.
 */
function childEnv(extra = {}) {
  const env = { ...process.env, ...extra };
  if (!Object.prototype.hasOwnProperty.call(extra, "DISCORD_LANG")) {
    delete env.DISCORD_LANG;
  }
  return env;
}

// In-process tests assert English text; pin it and restore the default afterwards.
// Subprocess tests select their language through argv or childEnv().
beforeEach(() => {
  setLanguage("en");
});

afterEach(() => {
  setLanguage(DEFAULT_LANGUAGE);
  temp.cleanup();
});

function runCli(scriptPath, args, extraEnv) {
  return spawnSync(process.execPath, [scriptPath, ...args], {
    encoding: "utf8",
    timeout: 10000,
    env: childEnv(extraEnv),
  });
}

function runBackupMain(args, options = {}) {
  const script = `
    const backup = require("./bin/backup");
    const config = require("./src/config");
    const logger = require("./src/ui/logger");
    let calls = 0;
    backup.main(${JSON.stringify(args)}, async (...runnerArgs) => {
      calls++;
      const [resolvedConfig, cancelToken] = runnerArgs;
      config.validateConfig(resolvedConfig);
      cancelToken.throwIfCancelled();
      console.log(JSON.stringify({
        calls,
        argCount: runnerArgs.length,
        resolvedConfig,
        tokenUsable: typeof cancelToken.cancel === "function" && !cancelToken.isCancelled(),
        verbose: logger.isVerbose()
      }));
      if (${Boolean(options.rejectRunner)}) throw new Error("injected runner failure");
    }).then(() => {
      console.log(JSON.stringify({ outcome: "resolved", verboseAfterMain: logger.isVerbose() }));
    }).catch((error) => {
      console.log(JSON.stringify({
        outcome: "rejected",
        error: error.message,
        verboseAfterMain: logger.isVerbose()
      }));
    });
  `;

  return spawnSync(process.execPath, ["-e", script], {
    encoding: "utf8",
    timeout: 10000,
    cwd: path.resolve(__dirname, ".."),
    env: childEnv({ P2_2_SECRET_SENTINEL: options.secret, ...options.env }),
  });
}

describe("CLI exports", () => {
  it("backup.js exports parseCliArgs, applyOverrides, and handleFatalError", () => {
    assert.equal(typeof backup.parseCliArgs, "function");
    assert.equal(typeof backup.applyOverrides, "function");
    assert.equal(typeof backup.handleFatalError, "function");
  });

  it("regen-html.js exports parseCliArgs", () => {
    assert.equal(typeof regen.parseCliArgs, "function");
  });
});

describe("backup.js parseCliArgs", () => {
  it("parses --output and --profile", () => {
    const args = backupArgs.parseCliArgs(["--output", "./out", "--profile", "./prof"]);
    assert.deepEqual(args, {
      help: false,
      version: false,
      verbose: false,
      dryRun: false,
      output: "./out",
      profile: "./prof",
    });
  });

  it("returns an error for an unknown option", () => {
    const args = backupArgs.parseCliArgs(["--foo"]);
    assert.equal(args.error, "Unknown option: --foo");
  });
});

describe("regen-html.js parseCliArgs", () => {
  it("collects positional arguments and flags", () => {
    const args = regen.parseCliArgs(["backups/channel"]);
    assert.deepEqual(args, {
      help: false,
      version: false,
      _: ["backups/channel"],
    });
  });

  it("returns an error for an unknown option", () => {
    const args = regen.parseCliArgs(["--foo"]);
    assert.equal(args.error, "Unknown option: --foo");
  });

  it("parses --lang with a value", () => {
    const args = regen.parseCliArgs(["--lang", "en", "backups/channel"]);
    assert.deepEqual(args, {
      help: false,
      version: false,
      lang: "en",
      _: ["backups/channel"],
    });
  });

  it("returns an error when --lang has no value", () => {
    assert.equal(regen.parseCliArgs(["--lang"]).error, "Missing value for --lang");
  });
});

describe("applyOverrides", () => {
  it("returns a config with resolved backupDir and profileDir overrides", () => {
    const cfg = { backupDir: "/a", profileDir: "/b" };
    const result = backup.applyOverrides(cfg, { output: "./out", profile: "./prof" });
    assert.equal(result.backupDir, path.resolve("./out"));
    assert.equal(result.profileDir, path.resolve("./prof"));
    assert.equal(Object.isFrozen(result), true);
  });
});

describe("handleFatalError", () => {
  it("prints an unexpected error stack before exiting", () => {
    const output = [];
    const originalError = console.error;
    const originalExit = process.exit;
    console.error = (...args) => output.push(args.join(" "));
    process.exit = (code) => {
      throw new Error(`process.exit:${code}`);
    };

    try {
      const error = new Error("unexpected failure");
      error.stack = "Error: unexpected failure\n    at test";
      assert.throws(() => backup.handleFatalError(error), /process\.exit/);
    } finally {
      console.error = originalError;
      process.exit = originalExit;
    }

    assert.match(output.join("\n"), /Fatal error: Error: unexpected failure/);
    assert.match(output.join("\n"), /at test/);
  });

  it("falls back to an unexpected error message when no stack is available", () => {
    const output = [];
    const originalError = console.error;
    const originalExit = process.exit;
    console.error = (...args) => output.push(args.join(" "));
    process.exit = (code) => {
      throw new Error(`process.exit:${code}`);
    };

    try {
      assert.throws(
        () => backup.handleFatalError({ message: "unexpected failure" }),
        /process\.exit/
      );
    } finally {
      console.error = originalError;
      process.exit = originalExit;
    }

    assert.match(output.join("\n"), /Fatal error: unexpected failure/);
  });

  it("prints the fatal error label in Spanish when the language is Spanish", () => {
    setLanguage("es");
    const output = [];
    const originalError = console.error;
    const originalExit = process.exit;
    console.error = (...args) => output.push(args.join(" "));
    process.exit = (code) => {
      throw new Error(`process.exit:${code}`);
    };

    try {
      assert.throws(
        () => backup.handleFatalError({ message: "unexpected failure" }),
        /process\.exit/
      );
    } finally {
      console.error = originalError;
      process.exit = originalExit;
    }

    assert.match(output.join("\n"), /Error fatal: unexpected failure/);
  });
});

describe("backup.js main diagnostics", () => {
  it("emits safe operational diagnostics and calls the runner once with --verbose", () => {
    const output = path.resolve("verbose-output");
    const profile = path.resolve("verbose-profile");
    const secret = "p2.2-secret-sentinel-7af61e";
    const result = runBackupMain(
      ["--verbose", "--dry-run", "--output", output, "--profile", profile],
      { secret }
    );

    assert.equal(result.status, 0, result.stderr);
    assert.match(result.stderr, new RegExp(`Output directory: ${output.replace(/\\/g, "\\\\")}`));
    assert.match(result.stderr, new RegExp(`Profile directory: ${profile.replace(/\\/g, "\\\\")}`));
    assert.match(result.stderr, /Dry run: enabled/);
    assert.doesNotMatch(result.stderr, /token|authorization|cookie|headers|environment/i);
    assert.equal(result.stdout.includes(secret), false);
    assert.equal(result.stderr.includes(secret), false);

    const [during, after] = result.stdout.trim().split(/\r?\n/).map(JSON.parse);
    assert.equal(during.calls, 1);
    assert.equal(during.argCount, 2);
    assert.equal(during.tokenUsable, true);
    assert.equal(during.resolvedConfig.backupDir, output);
    assert.equal(during.resolvedConfig.profileDir, profile);
    assert.equal(during.resolvedConfig.dryRun, true);
    assert.equal(during.resolvedConfig.language, "es");
    assert.equal(during.verbose, true);
    assert.equal(after.outcome, "resolved");
    assert.equal(after.verboseAfterMain, false);
  });

  it("propagates runner rejection, resets verbose, and reports disabled dry-run", () => {
    const result = runBackupMain(["--verbose"], { rejectRunner: true });

    assert.equal(result.status, 0, result.stderr);
    assert.match(result.stderr, /Dry run: disabled/);
    const [during, after] = result.stdout.trim().split(/\r?\n/).map(JSON.parse);
    assert.equal(during.calls, 1);
    assert.equal(during.argCount, 2);
    assert.equal(during.tokenUsable, true);
    assert.equal(after.outcome, "rejected");
    assert.equal(after.error, "injected runner failure");
    assert.equal(after.verboseAfterMain, false);
  });

  it("suppresses diagnostics without --verbose and still resets logger state", () => {
    const result = runBackupMain(["--dry-run"]);

    assert.equal(result.status, 0, result.stderr);
    assert.equal(result.stderr, "");
    const [during, after] = result.stdout.trim().split(/\r?\n/).map(JSON.parse);
    assert.equal(during.calls, 1);
    assert.equal(during.verbose, false);
    assert.equal(after.outcome, "resolved");
    assert.equal(after.verboseAfterMain, false);
  });
});

describe("backup.js main language", () => {
  it("passes the --lang value into the config", () => {
    const result = runBackupMain(["--dry-run", "--lang", "en"]);
    assert.equal(result.status, 0, result.stderr);
    const [during] = result.stdout.trim().split(/\r?\n/).map(JSON.parse);
    assert.equal(during.resolvedConfig.language, "en");
  });

  it("passes the DISCORD_LANG value into the config when no flag is given", () => {
    const result = runBackupMain(["--dry-run"], { env: { DISCORD_LANG: "en" } });
    assert.equal(result.status, 0, result.stderr);
    const [during] = result.stdout.trim().split(/\r?\n/).map(JSON.parse);
    assert.equal(during.resolvedConfig.language, "en");
  });

  it("lets --lang win over DISCORD_LANG", () => {
    const result = runBackupMain(["--dry-run", "--lang", "es"], { env: { DISCORD_LANG: "en" } });
    assert.equal(result.status, 0, result.stderr);
    const [during] = result.stdout.trim().split(/\r?\n/).map(JSON.parse);
    assert.equal(during.resolvedConfig.language, "es");
  });
});

describe("CLI smoke tests", () => {
  const backupPath = path.resolve(__dirname, "..", "bin", "backup.js");
  const regenPath = path.resolve(__dirname, "..", "bin", "regen-html.js");

  it("backup.js --help prints Spanish usage by default and exits 0", () => {
    const result = runCli(backupPath, ["--help"]);
    assert.equal(result.status, 0);
    assert.match(result.stdout, /Uso: node bin\/backup\.js \[opciones\]/);
    assert.match(result.stdout, /Muestra esta ayuda/);
    assert.doesNotMatch(result.stdout, /Usage:/);
  });

  it("backup.js --lang en --help prints English usage", () => {
    const result = runCli(backupPath, ["--lang", "en", "--help"]);
    assert.equal(result.status, 0, result.stderr);
    assert.match(result.stdout, /Usage: node bin\/backup\.js \[options\]/);
    assert.match(result.stdout, /Show this help message/);
  });

  it("backup.js --help prints English usage with DISCORD_LANG=en", () => {
    const result = runCli(backupPath, ["--help"], { DISCORD_LANG: "en" });
    assert.equal(result.status, 0, result.stderr);
    assert.match(result.stdout, /Usage: node bin\/backup\.js \[options\]/);
  });

  it("backup.js does not take a --lang that is the value of --output", () => {
    // The parser reads "--lang" as the output directory and "en" as an
    // unexpected argument, so the language stays the default (Spanish).
    const result = runCli(backupPath, ["--output", "--lang", "en", "--help"]);
    assert.equal(result.status, 1);
    assert.match(result.stderr, /Error: Argumento inesperado: en/);
    assert.match(result.stdout, /Uso:/);
  });

  it("regen-html.js parser and findLangFlag agree on the --lang value", () => {
    const valueOptions = Object.keys(regen.VALUE_OPTIONS);
    assert.deepEqual(regen.VALUE_OPTIONS, { "--lang": "lang" });
    for (const argv of [["dir"], ["--lang", "en", "dir"], ["--lang", "--help", "dir"]]) {
      const parsed = regen.parseCliArgs(argv);
      assert.equal(parsed.error, undefined, JSON.stringify(argv));
      assert.equal(findLangFlag(argv, valueOptions), parsed.lang, JSON.stringify(argv));
    }
  });

  it("backup.js --version prints the version and exits 0", () => {
    const result = spawnSync(process.execPath, [backupPath, "--version"], {
      encoding: "utf8",
      timeout: 10000,
      env: childEnv(),
    });
    assert.equal(result.status, 0);
    assert.equal(result.stdout.trim(), pkg.version);
  });

  it("regen-html.js --help prints Spanish usage by default and exits 0", () => {
    const result = runCli(regenPath, ["--help"]);
    assert.equal(result.status, 0);
    assert.match(result.stdout, /Uso: node bin\/regen-html\.js \[opciones\] <backup-folder>/);
    assert.doesNotMatch(result.stdout, /Usage:/);
  });

  it("regen-html.js --lang en --help prints English usage", () => {
    const result = runCli(regenPath, ["--lang", "en", "--help"]);
    assert.equal(result.status, 0, result.stderr);
    assert.match(result.stdout, /Usage: node bin\/regen-html\.js \[options\] <backup-folder>/);
  });

  it("regen-html.js --version prints the version and exits 0", () => {
    const result = spawnSync(process.execPath, [regenPath, "--version"], {
      encoding: "utf8",
      timeout: 10000,
      env: childEnv(),
    });
    assert.equal(result.status, 0);
    assert.equal(result.stdout.trim(), pkg.version);
  });

  it("backup.js --help lists --lang", () => {
    const result = spawnSync(process.execPath, [backupPath, "--help"], {
      encoding: "utf8",
      timeout: 10000,
      env: childEnv(),
    });
    assert.equal(result.status, 0);
    assert.match(result.stdout, /--lang <code>/);
  });

  it("regen-html.js --help lists --lang", () => {
    const result = spawnSync(process.execPath, [regenPath, "--help"], {
      encoding: "utf8",
      timeout: 10000,
      env: childEnv(),
    });
    assert.equal(result.status, 0);
    assert.match(result.stdout, /--lang <code>/);
  });

  for (const [name, scriptPath] of [
    ["backup.js", backupPath],
    ["regen-html.js", regenPath],
  ]) {
    it(`${name} rejects an invalid --lang value in Spanish by default and exits 1`, () => {
      const result = runCli(scriptPath, ["--lang", "xx"]);
      assert.equal(result.status, 1);
      assert.match(result.stderr, /Error: Valor no válido para --lang: "xx"/);
      assert.match(result.stderr, /Valores admitidos: es, en/);
    });

    it(`${name} rejects an invalid --lang value in the DISCORD_LANG language`, () => {
      const result = runCli(scriptPath, ["--lang", "xx"], { DISCORD_LANG: "en" });
      assert.equal(result.status, 1);
      assert.match(result.stderr, /Error: Invalid value for --lang: "xx"/);
      assert.match(result.stderr, /Supported values: es, en/);
    });

    it(`${name} warns about an invalid DISCORD_LANG and falls back to Spanish`, () => {
      const result = runCli(scriptPath, ["--help"], { DISCORD_LANG: "xx" });
      assert.equal(result.status, 0, result.stderr);
      assert.match(result.stderr, /Advertencia: valor no válido para DISCORD_LANG: "xx"/);
      assert.match(result.stderr, /Valores admitidos: es, en/);
      assert.match(result.stdout, /Uso:/);
    });

    it(`${name} --version still works with an invalid DISCORD_LANG`, () => {
      const result = runCli(scriptPath, ["--version"], { DISCORD_LANG: "xx" });
      assert.equal(result.status, 0, result.stderr);
      assert.equal(result.stdout.trim(), pkg.version);
      assert.match(result.stderr, /DISCORD_LANG: "xx"/);
    });

    it(`${name} lets a valid --lang win over an invalid DISCORD_LANG`, () => {
      const result = runCli(scriptPath, ["--lang", "en", "--help"], { DISCORD_LANG: "xx" });
      assert.equal(result.status, 0, result.stderr);
      assert.match(result.stdout, /Usage:/);
      assert.equal(result.stderr, "");
    });

    it(`${name} reports argument errors in the --lang language even before --lang`, () => {
      const english = runCli(scriptPath, ["--foo", "--lang", "en"]);
      assert.equal(english.status, 1);
      assert.match(english.stderr, /Error: Unknown option: --foo/);
      assert.match(english.stdout, /Usage:/);

      const spanish = runCli(scriptPath, ["--foo"]);
      assert.equal(spanish.status, 1);
      assert.match(spanish.stderr, /Error: Opción desconocida: --foo/);
      assert.match(spanish.stdout, /Uso:/);
    });
  }

  it("regen-html.js reports a missing folder argument in the selected language", () => {
    const english = runCli(regenPath, ["--lang", "en"]);
    assert.equal(english.status, 1);
    assert.match(english.stderr, /Error: Missing backup-folder argument\./);

    const spanish = runCli(regenPath, []);
    assert.equal(spanish.status, 1);
    assert.match(spanish.stderr, /Error: Falta el argumento backup-folder\./);
  });

  it("regen-html.js reports a missing messages.json in the selected language", () => {
    const dir = temp.make("regen-missing-");
    const english = runCli(regenPath, ["--lang", "en", dir]);
    assert.equal(english.status, 1);
    assert.match(english.stderr, /Not found: .*messages\.json/);

    const spanish = runCli(regenPath, [dir]);
    assert.equal(spanish.status, 1);
    assert.match(spanish.stderr, /No se encontró: .*messages\.json/);
  });

  it("regen-html.js reports an unparsable messages.json in the selected language", () => {
    const dir = temp.make("regen-bad-");
    fs.writeFileSync(path.join(dir, "messages.json"), "{not json", "utf8");
    const english = runCli(regenPath, ["--lang", "en", dir]);
    assert.equal(english.status, 1);
    assert.match(english.stderr, /Error: Could not read or parse .*messages\.json: /);

    const spanish = runCli(regenPath, [dir]);
    assert.equal(spanish.status, 1);
    assert.match(spanish.stderr, /Error: No se pudo leer o interpretar .*messages\.json: /);
  });

  it("regen-html.js reports the regenerated file and message count in the selected language", () => {
    const dir = temp.make("regen-ok-");
    fs.writeFileSync(path.join(dir, "messages.json"), "[]", "utf8");
    const english = runCli(regenPath, ["--lang", "en", dir]);
    assert.equal(english.status, 0, english.stderr);
    assert.match(english.stdout, /^ {2}Done: .*index\.html {2}\(0 messages\)/);

    const spanish = runCli(regenPath, [dir]);
    assert.equal(spanish.status, 0, spanish.stderr);
    assert.match(spanish.stdout, /^ {2}Listo: .*index\.html {2}\(0 mensajes\)/);
  });

  it("regen-html.js uses the singular for a single message in the selected language", () => {
    const dir = temp.make("regen-one-");
    try {
      const messages = [{ msgId: "1", timestamp: "2024-03-15T14:32:00.000Z", text: "hi" }];
      fs.writeFileSync(path.join(dir, "messages.json"), JSON.stringify(messages), "utf8");

      const english = runCli(regenPath, ["--lang", "en", dir]);
      assert.equal(english.status, 0, english.stderr);
      assert.match(english.stdout, /^ {2}Done: .*index\.html {2}\(1 message\)\r?\n$/);

      const spanish = runCli(regenPath, [dir]);
      assert.equal(spanish.status, 0, spanish.stderr);
      assert.match(spanish.stdout, /^ {2}Listo: .*index\.html {2}\(1 mensaje\)\r?\n$/);
    } finally {
      fs.rmSync(dir, { recursive: true, force: true });
    }
  });

  it("regen-html.js writes the viewer in the selected language", () => {
    const dir = temp.make("regen-viewer-");
    const ts = "2024-03-15T14:32:00.000Z";
    const messages = [{ msgId: "1", timestamp: ts, author: "Alice", text: "hi" }];
    fs.writeFileSync(path.join(dir, "messages.json"), JSON.stringify(messages), "utf8");
    const htmlPath = path.join(dir, "index.html");
    const regenerate = (args, extraEnv) => {
      const result = runCli(regenPath, [...args, dir], extraEnv);
      assert.equal(result.status, 0, result.stderr);
      return fs.readFileSync(htmlPath, "utf8");
    };

    try {
      const english = regenerate(["--lang", "en"]);
      assert.match(english, /<html lang="en">/);
      assert.match(english, /placeholder="Search the chat…"/);
      assert.match(english, /<button id="clear-btn">✕ Clear<\/button>/);
      assert.match(english, /<span class="header-meta">1 message &mdash; /);
      const englishDate = new Date(ts).toLocaleString("en-US");
      assert.ok(english.includes(`<span class="date">${englishDate}</span>`), englishDate);

      assert.match(regenerate([], { DISCORD_LANG: "en" }), /<html lang="en">/);

      const spanish = regenerate([]);
      assert.match(spanish, /<html lang="es">/);
      assert.match(spanish, /placeholder="Buscar en el chat…"/);
      assert.match(spanish, /<span class="header-meta">1 mensaje &mdash; /);
      const spanishDate = new Date(ts).toLocaleString("es-AR");
      assert.ok(spanish.includes(`<span class="date">${spanishDate}</span>`), spanishDate);
      assert.deepEqual(
        JSON.parse(fs.readFileSync(path.join(dir, "messages.json"), "utf8")),
        messages
      );
    } finally {
      fs.rmSync(dir, { recursive: true, force: true });
    }
  });

  it("backup.js prints a friendly config error in the selected language and exits 1", () => {
    const script = `
      const configPath = require.resolve("./src/config");
      const original = require(configPath);
      require.cache[configPath].exports = {
        ...original,
        loadConfig: () => ({
          backupDir: "",
          profileDir: "/profile",
          apiBatchSize: 50,
          apiDelayMs: 400,
          downloadTimeoutMs: 20000,
          maxRetries: 3,
          maxRedirects: 10,
          retryDelayMs: 1000,
          jitterMaxMs: 500,
        }),
      };
      require("./bin/backup").main([]);
    `;
    const run = (extraEnv) =>
      spawnSync(process.execPath, ["-e", script], {
        encoding: "utf8",
        timeout: 10000,
        cwd: path.resolve(__dirname, ".."),
        env: childEnv(extraEnv),
      });

    const english = run({ DISCORD_LANG: "en" });
    assert.equal(english.status, 1);
    assert.match(english.stderr, /Error: backupDir must be a non-empty string\./);

    const spanish = run();
    assert.equal(spanish.status, 1);
    assert.match(spanish.stderr, /Error: backupDir debe ser una cadena no vacía\./);
  });
});
