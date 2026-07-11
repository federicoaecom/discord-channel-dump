/**
 * Filesystem helpers.
 */

"use strict";

const fs = require("fs");

/**
 * Ensure a directory exists, creating it recursively if necessary.
 * @param {string} p - Directory path.
 */
function ensureDir(p) {
  if (!fs.existsSync(p)) fs.mkdirSync(p, { recursive: true });
}

module.exports = { ensureDir };
