const pkg = require("../package.json");
const { describe, it } = require("node:test");
const assert = require("node:assert/strict");
const { spawnSync } = require("node:child_process");
const path = require("node:path");

const backupArgs = require("../src/cli/backup-args.js");
const backup = require("../bin/backup.js");
const regen = require("../bin/regen-html.js");

describe("CLI exports", () => {
  it("backup.js exports parseCliArgs and applyOverrides", () => {
    assert.equal(typeof backup.parseCliArgs, "function");
    assert.equal(typeof backup.applyOverrides, "function");
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
});

describe("applyOverrides", () => {
  it("returns a config with resolved backupDir and profileDir overrides", () => {
    const cfg = { backupDir: "/a", profileDir: "/b" };
    const result = backup.applyOverrides(cfg, { output: "./out", profile: "./prof" });
    assert.equal(result.backupDir, path.resolve("./out"));
    assert.equal(result.profileDir, path.resolve("./prof"));
  });
});

describe("CLI smoke tests", () => {
  const backupPath = path.resolve(__dirname, "..", "bin", "backup.js");
  const regenPath = path.resolve(__dirname, "..", "bin", "regen-html.js");

  it("backup.js --help prints usage and exits 0", () => {
    const result = spawnSync(process.execPath, [backupPath, "--help"], {
      encoding: "utf8",
      timeout: 10000,
    });
    assert.equal(result.status, 0);
    assert.match(result.stdout, /Usage:/);
  });

  it("backup.js --version prints the version and exits 0", () => {
    const result = spawnSync(process.execPath, [backupPath, "--version"], {
      encoding: "utf8",
      timeout: 10000,
    });
    assert.equal(result.status, 0);
    assert.equal(result.stdout.trim(), pkg.version);
  });

  it("regen-html.js --help prints usage and exits 0", () => {
    const result = spawnSync(process.execPath, [regenPath, "--help"], {
      encoding: "utf8",
      timeout: 10000,
    });
    assert.equal(result.status, 0);
    assert.match(result.stdout, /Usage:/);
  });

  it("regen-html.js --version prints the version and exits 0", () => {
    const result = spawnSync(process.execPath, [regenPath, "--version"], {
      encoding: "utf8",
      timeout: 10000,
    });
    assert.equal(result.status, 0);
    assert.equal(result.stdout.trim(), pkg.version);
  });

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
    });
    assert.equal(result.status, 1);
    assert.match(result.stderr, /Error: backupDir must be a non-empty string/);
  });
});
