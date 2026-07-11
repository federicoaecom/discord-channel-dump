/**
 * Filename sanitization helpers.
 */

"use strict";

/**
 * Sanitize a string for safe use as a directory or filename.
 * @param {string} name - Raw name.
 * @returns {string} Sanitized name.
 */
function sanitize(name) {
  return (
    name
      // eslint-disable-next-line no-control-regex
      .replace(/[<>:"/\\|?*\x00-\x1F]/g, "_")
      .trim()
      .replace(/^#+\s*/, "")
  );
}

module.exports = { sanitize };
