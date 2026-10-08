const pkg = require("../package.json");
const { describe, it } = require("node:test");
const assert = require("node:assert/strict");
const { spawnSync } = require("node:child_process");
const path = require("node:path");

const backupArgs = require("../src/cli/backup-args.js");
const backup = require("../bin/backup.js");
const regen = require("../bin/regen-html.js");

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

  it("backup.js --help prints usage and exits 0", () => {
    const result = spawnSync(process.execPath, [backupPath, "--help"], {
      encoding: "utf8",
      timeout: 10000,
      env: childEnv(),
    });
    assert.equal(result.status, 0);
    assert.match(result.stdout, /Usage:/);
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

  it("regen-html.js --help prints usage and exits 0", () => {
    const result = spawnSync(process.execPath, [regenPath, "--help"], {
      encoding: "utf8",
      timeout: 10000,
      env: childEnv(),
    });
    assert.equal(result.status, 0);
    assert.match(result.stdout, /Usage:/);
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
    it(`${name} rejects an invalid --lang value and exits 1`, () => {
      const result = spawnSync(process.execPath, [scriptPath, "--lang", "xx"], {
        encoding: "utf8",
        timeout: 10000,
        env: childEnv(),
      });
      assert.equal(result.status, 1);
      assert.match(result.stderr, /Error: Invalid value for --lang: "xx"/);
      assert.match(result.stderr, /Supported values: es, en/);
    });

    it(`${name} rejects an invalid DISCORD_LANG value and exits 1`, () => {
      const result = spawnSync(process.execPath, [scriptPath, "--help"], {
        encoding: "utf8",
        timeout: 10000,
        env: childEnv({ DISCORD_LANG: "xx" }),
      });
      assert.equal(result.status, 1);
      assert.match(result.stderr, /Error: Invalid value for DISCORD_LANG: "xx"/);
    });

    it(`${name} lets a valid --lang win over an invalid DISCORD_LANG`, () => {
      const result = spawnSync(process.execPath, [scriptPath, "--lang", "en", "--help"], {
        encoding: "utf8",
        timeout: 10000,
        env: childEnv({ DISCORD_LANG: "xx" }),
      });
      assert.equal(result.status, 0, result.stderr);
      assert.match(result.stdout, /Usage:/);
    });
  }

  it("backup.js prints a friendly config error and exits 1", () => {
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
    const result = spawnSync(process.execPath, ["-e", script], {
      encoding: "utf8",
      timeout: 10000,
      cwd: path.resolve(__dirname, ".."),
      env: childEnv(),
    });
    assert.equal(result.status, 1);
    assert.match(result.stderr, /Error: backupDir must be a non-empty string/);
  });
});
