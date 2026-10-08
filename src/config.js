/**
 * Configuration options for discord-channel-dump
 */

"use strict";

const path = require("path");
const { DEFAULT_LANGUAGE, SUPPORTED_LANGUAGES } = require("./i18n");

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
 * Validates a configuration object. Throws ConfigError on invalid values.
 */
function validateConfig(config) {
  if (!config || typeof config !== "object") {
    throw new ConfigError("Configuration must be an object.");
  }

  if (typeof config.backupDir !== "string" || config.backupDir.length === 0) {
    throw new ConfigError("backupDir must be a non-empty string.");
  }
  if (typeof config.profileDir !== "string" || config.profileDir.length === 0) {
    throw new ConfigError("profileDir must be a non-empty string.");
  }
  if (
    !Number.isInteger(config.apiBatchSize) ||
    config.apiBatchSize <= 0 ||
    config.apiBatchSize > 100
  ) {
    throw new ConfigError("apiBatchSize must be an integer between 1 and 100");
  }
  if (!Number.isFinite(config.apiDelayMs) || config.apiDelayMs < 0) {
    throw new ConfigError("apiDelayMs must be a non-negative number.");
  }
  if (!Number.isFinite(config.downloadTimeoutMs) || config.downloadTimeoutMs <= 0) {
    throw new ConfigError("downloadTimeoutMs must be a positive number.");
  }
  if (!Number.isInteger(config.maxRetries) || config.maxRetries <= 0) {
    throw new ConfigError("maxRetries must be a positive integer.");
  }
  if (!Number.isInteger(config.maxRedirects) || config.maxRedirects <= 0) {
    throw new ConfigError("maxRedirects must be a positive integer.");
  }
  if (!Number.isFinite(config.retryDelayMs) || config.retryDelayMs < 0) {
    throw new ConfigError("retryDelayMs must be a non-negative number.");
  }
  if (!Number.isFinite(config.jitterMaxMs) || config.jitterMaxMs < 0) {
    throw new ConfigError("jitterMaxMs must be a non-negative number.");
  }
  if (typeof config.dryRun !== "boolean") {
    throw new ConfigError("dryRun must be a boolean.");
  }
  if (!SUPPORTED_LANGUAGES.includes(config.language)) {
    throw new ConfigError(`language must be one of: ${SUPPORTED_LANGUAGES.join(", ")}.`);
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
