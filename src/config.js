/**
 * Configuration options for discord-channel-dump
 */

"use strict";

const path = require("path");
const { DEFAULT_LANGUAGE, SUPPORTED_LANGUAGES, t } = require("./i18n");

const defaults = {
  // Directory where backups will be stored
  backupDir: process.env.DISCORD_BACKUP_DIR || path.join(__dirname, "..", "backups"),

  // Directory for persistent browser session profiles (cookies, login state)
  profileDir: process.env.DISCORD_PROFILE_DIR || path.join(__dirname, "..", "browser-profile"),

  // Number of messages to request per API call (max 100)
  apiBatchSize: 50,

  // Delay in milliseconds between consecutive API requests to avoid rate limits
  apiDelayMs: 400,

  // Hard timeout limit in milliseconds for downloading single files (images/attachments)
  downloadTimeoutMs: 20000,

  // Retry / backoff tunables for the downloader
  maxRetries: 3,
  maxRedirects: 10,
  retryDelayMs: 1000,
  jitterMaxMs: 500,

  // When true, fetch message metadata but do not save files or download media
  dryRun: false,

  // Interface language. The CLI resolves it with resolveLanguage() in src/i18n
  // (--lang, then DISCORD_LANG, then this default) and passes it as an override.
  language: DEFAULT_LANGUAGE,
};

class ConfigError extends Error {
  /**
   * @param {string} message - Human-readable configuration error message.
   */
  constructor(message) {
    super(message);
    this.name = "ConfigError";
  }
}

/**
 * Build a ConfigError whose message uses the active language.
 * Config field names are passed as `field` and stay untranslated.
 * @param {string} key - i18n message key under `config.`.
 * @param {Record<string, unknown>} [params] - Placeholder values.
 * @returns {ConfigError} The error to throw.
 */
function configError(key, params) {
  return new ConfigError(t(key, params));
}

/**
 * Validates a configuration object. Throws ConfigError on invalid values.
 */
function validateConfig(config) {
  if (!config || typeof config !== "object") {
    throw configError("config.notObject");
  }

  for (const field of ["backupDir", "profileDir"]) {
    if (typeof config[field] !== "string" || config[field].length === 0) {
      throw configError("config.nonEmptyString", { field });
    }
  }
  if (
    !Number.isInteger(config.apiBatchSize) ||
    config.apiBatchSize <= 0 ||
    config.apiBatchSize > 100
  ) {
    throw configError("config.integerRange", { field: "apiBatchSize", min: 1, max: 100 });
  }
  if (!Number.isFinite(config.apiDelayMs) || config.apiDelayMs < 0) {
    throw configError("config.nonNegativeNumber", { field: "apiDelayMs" });
  }
  if (!Number.isFinite(config.downloadTimeoutMs) || config.downloadTimeoutMs <= 0) {
    throw configError("config.positiveNumber", { field: "downloadTimeoutMs" });
  }
  for (const field of ["maxRetries", "maxRedirects"]) {
    if (!Number.isInteger(config[field]) || config[field] <= 0) {
      throw configError("config.positiveInteger", { field });
    }
  }
  for (const field of ["retryDelayMs", "jitterMaxMs"]) {
    if (!Number.isFinite(config[field]) || config[field] < 0) {
      throw configError("config.nonNegativeNumber", { field });
    }
  }
  if (typeof config.dryRun !== "boolean") {
    throw configError("config.boolean", { field: "dryRun" });
  }
  if (!SUPPORTED_LANGUAGES.includes(config.language)) {
    throw configError("config.oneOf", {
      field: "language",
      values: SUPPORTED_LANGUAGES.join(", "),
    });
  }
}

/**
 * Returns a frozen copy of the default configuration with optional overrides applied.
 */
function loadConfig(overrides = {}) {
  const cfg = { ...defaults, ...overrides };
  return Object.freeze(cfg);
}

// Export a frozen wrapper that exposes the default config values plus helpers.
module.exports = Object.freeze({
  loadConfig,
  validateConfig,
  defaults,
  ConfigError,
  ...loadConfig(),
});
