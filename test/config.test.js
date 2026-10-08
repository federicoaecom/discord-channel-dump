const { describe, it } = require("node:test");
const assert = require("node:assert/strict");
const path = require("node:path");
const { spawnSync } = require("node:child_process");
const config = require("../src/config.js");
const { validateConfig, ConfigError, loadConfig } = config;

function makeCfg(overrides = {}) {
  return {
    backupDir: "/backups",
    profileDir: "/profile",
    apiBatchSize: 50,
    apiDelayMs: 400,
    downloadTimeoutMs: 20000,
    maxRetries: 3,
    maxRedirects: 10,
    retryDelayMs: 1000,
    jitterMaxMs: 500,
    dryRun: false,
    language: "es",
    ...overrides,
  };
}

it("keeps default runtime paths at the project root after moving config to src/", () => {
  const root = path.resolve(__dirname, "..");
  assert.equal(config.defaults.backupDir, path.join(root, "backups"));
  assert.equal(config.defaults.profileDir, path.join(root, "browser-profile"));
});

describe("loadConfig", () => {
  it("returns a frozen config object with defaults", () => {
    const cfg = loadConfig();
    assert.equal(cfg.apiBatchSize, 50);
    assert.equal(Object.isFrozen(cfg), true);
  });

  it("applies overrides without mutating defaults", () => {
    const original = config.defaults.apiBatchSize;
    const cfg = loadConfig({ apiBatchSize: 10 });
    assert.equal(cfg.apiBatchSize, 10);
    assert.equal(config.defaults.apiBatchSize, original);
  });
});

describe("validateConfig", () => {
  it("accepts a fully valid configuration", () => {
    assert.doesNotThrow(() => validateConfig(makeCfg()));
  });

  it("rejects a non-object configuration", () => {
    assert.throws(() => validateConfig(null), ConfigError);
  });

  it("rejects apiBatchSize equal to zero", () => {
    assert.throws(
      () => validateConfig(makeCfg({ apiBatchSize: 0 })),
      /apiBatchSize must be an integer between 1 and 100/
    );
  });

  it("rejects a missing backupDir", () => {
    assert.throws(
      () => validateConfig(makeCfg({ backupDir: undefined })),
      /backupDir must be a non-empty string/
    );
  });

  it("rejects an empty profileDir", () => {
    assert.throws(
      () => validateConfig(makeCfg({ profileDir: "" })),
      /profileDir must be a non-empty string/
    );
  });

  it("rejects a negative apiDelayMs", () => {
    assert.throws(
      () => validateConfig(makeCfg({ apiDelayMs: -1 })),
      /apiDelayMs must be a non-negative number/
    );
  });

  it("rejects a non-positive downloadTimeoutMs", () => {
    assert.throws(
      () => validateConfig(makeCfg({ downloadTimeoutMs: 0 })),
      /downloadTimeoutMs must be a positive number/
    );
  });

  it("rejects apiBatchSize greater than 100", () => {
    assert.throws(
      () => validateConfig(makeCfg({ apiBatchSize: 101 })),
      /apiBatchSize must be an integer between 1 and 100/
    );
  });

  it("rejects a non-integer apiBatchSize", () => {
    assert.throws(
      () => validateConfig(makeCfg({ apiBatchSize: 50.5 })),
      /apiBatchSize must be an integer between 1 and 100/
    );
  });

  it("rejects a non-positive maxRetries", () => {
    assert.throws(
      () => validateConfig(makeCfg({ maxRetries: 0 })),
      /maxRetries must be a positive integer/
    );
  });

  it("rejects a non-integer maxRetries", () => {
    assert.throws(
      () => validateConfig(makeCfg({ maxRetries: 1.5 })),
      /maxRetries must be a positive integer/
    );
  });

  it("rejects a non-positive maxRedirects", () => {
    assert.throws(
      () => validateConfig(makeCfg({ maxRedirects: -1 })),
      /maxRedirects must be a positive integer/
    );
  });

  it("rejects a non-finite maxRedirects", () => {
    assert.throws(
      () => validateConfig(makeCfg({ maxRedirects: Infinity })),
      /maxRedirects must be a positive integer/
    );
  });

  it("rejects a negative retryDelayMs", () => {
    assert.throws(
      () => validateConfig(makeCfg({ retryDelayMs: -1 })),
      /retryDelayMs must be a non-negative number/
    );
  });

  it("rejects a non-finite retryDelayMs", () => {
    assert.throws(
      () => validateConfig(makeCfg({ retryDelayMs: Infinity })),
      /retryDelayMs must be a non-negative number/
    );
  });

  it("rejects a negative jitterMaxMs", () => {
    assert.throws(
      () => validateConfig(makeCfg({ jitterMaxMs: -1 })),
      /jitterMaxMs must be a non-negative number/
    );
  });

  it("rejects a non-finite jitterMaxMs", () => {
    assert.throws(
      () => validateConfig(makeCfg({ jitterMaxMs: NaN })),
      /jitterMaxMs must be a non-negative number/
    );
  });

  it("rejects a non-boolean dryRun", () => {
    assert.throws(() => validateConfig(makeCfg({ dryRun: "yes" })), /dryRun must be a boolean/);
  });

  it("accepts both supported languages", () => {
    assert.doesNotThrow(() => validateConfig(makeCfg({ language: "es" })));
    assert.doesNotThrow(() => validateConfig(makeCfg({ language: "en" })));
  });

  it("rejects an unsupported or missing language", () => {
    for (const language of ["fr", "EN", "es-AR", "", undefined]) {
      assert.throws(
        () => validateConfig(makeCfg({ language })),
        (error) =>
          error instanceof ConfigError && /language must be one of: es, en/.test(error.message)
      );
    }
  });
});

describe("language default", () => {
  it("defaults to Spanish without reading DISCORD_LANG", () => {
    assert.equal(config.defaults.language, "es");
    assert.equal(loadConfig().language, "es");
    assert.equal(loadConfig({ language: "en" }).language, "en");
  });

  it("ignores DISCORD_LANG so resolveLanguage stays the single resolution point", () => {
    // A fresh process reads the env var at module load, so this catches any
    // config path (defaults, loadConfig, or the top-level spread) that consults it.
    const script = `
      const config = require("./src/config");
      console.log(JSON.stringify({
        defaults: config.defaults.language,
        loaded: config.loadConfig().language,
        topLevel: config.language,
      }));
    `;
    for (const value of ["en", "xx"]) {
      const result = spawnSync(process.execPath, ["-e", script], {
        encoding: "utf8",
        timeout: 10000,
        cwd: path.resolve(__dirname, ".."),
        env: { ...process.env, DISCORD_LANG: value },
      });
      assert.equal(result.status, 0, result.stderr);
      assert.equal(result.stderr, "", `DISCORD_LANG=${value}`);
      assert.deepEqual(
        JSON.parse(result.stdout),
        { defaults: "es", loaded: "es", topLevel: "es" },
        `DISCORD_LANG=${value}`
      );
    }
  });
});
