/**
 * Minimal logger with level support and a verbose flag.
 *
 * Defaults to info/warn/error output. Debug messages are only emitted when
 * verbose mode is enabled via `logger.setVerbose(true)` (usually from the
 * `--verbose` CLI flag).
 */

"use strict";

let verbose = false;

/**
 * Enable or disable verbose/debug output.
 * @param {boolean} value - True to enable debug logging.
 */
function setVerbose(value) {
  verbose = Boolean(value);
}

/**
 * Check whether verbose/debug output is enabled.
 * @returns {boolean} True when verbose mode is on.
 */
function isVerbose() {
  return verbose;
}

/**
 * Log an informational message to stdout.
 * @param {...any} args - Values to log.
 */
function info(...args) {
  console.log(...args);
}

/**
 * Log a warning to stderr.
 * @param {...any} args - Values to log.
 */
function warn(...args) {
  console.error(...args);
}

/**
 * Log an error to stderr.
 * @param {...any} args - Values to log.
 */
function error(...args) {
  console.error(...args);
}

/**
 * Log a debug message to stderr only when verbose mode is enabled.
 * @param {...any} args - Values to log.
 */
function debug(...args) {
  if (verbose) {
    console.error(...args);
  }
}

/**
 * Low-level write to stdout. Used for progress bars that overwrite the same
 * line without adding a newline.
 * @param {...string} args - Strings to write.
 */
function write(...args) {
  process.stdout.write(...args);
}

module.exports = {
  setVerbose,
  isVerbose,
  info,
  warn,
  error,
  debug,
  write,
};
