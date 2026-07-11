/**
 * ANSI color helpers with TTY and NO_COLOR awareness.
 */

"use strict";

/**
 * Check whether ANSI color output is enabled.
 * @returns {boolean} True when stdout is a TTY and NO_COLOR is unset.
 */
function isEnabled() {
  return process.stdout.isTTY && process.env.NO_COLOR !== "1";
}

/**
 * Wrap an ANSI color code into a function.
 * @param {number} code - ANSI SGR color code.
 * @returns {(text: string) => string} Function that applies the color.
 */
function wrap(code) {
  return (text) => (isEnabled() ? `\x1b[${code}m${text}\x1b[0m` : text);
}

/** @type {(text: string) => string} */
const red = wrap(31);

/** @type {(text: string) => string} */
const green = wrap(32);

/** @type {(text: string) => string} */
const yellow = wrap(33);

/** @type {(text: string) => string} */
const cyan = wrap(36);

/** @type {(text: string) => string} */
const dim = wrap(2);

module.exports = { red, green, yellow, cyan, dim, isEnabled };
