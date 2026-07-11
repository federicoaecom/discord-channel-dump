/**
 * HTML escaping helper.
 */

"use strict";

/**
 * Escape a string for safe insertion into HTML text or attributes.
 * @param {string} s - String to escape.
 * @returns {string} Escaped HTML string.
 */
function escapeHtml(s) {
  return String(s || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

module.exports = { escapeHtml };
