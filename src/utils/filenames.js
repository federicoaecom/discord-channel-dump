/**
 * Filename extraction and collision-handling helpers.
 */

"use strict";

const { createHash } = require("crypto");
const fs = require("fs");
const path = require("path");

function fallbackFilename(rawUrl) {
  const digest = createHash("sha256").update(String(rawUrl)).digest("hex");
  return `file_${BigInt(`0x${digest}`).toString(10)}`;
}

/**
 * Derive a safe filename from a URL.
 * @param {string} rawUrl - URL to extract the filename from.
 * @returns {string} Sanitized filename.
 */
function filenameFromUrl(rawUrl) {
  try {
    const u = new URL(rawUrl);
    // path.posix.basename always uses '/' as separator — safe for URL paths on Windows.
    let name = path.posix.basename(u.pathname.split("?")[0]);
    name = decodeURIComponent(name);
    // Strip any characters illegal in filenames (including stray slashes after decode).
    // eslint-disable-next-line no-control-regex
    name = name.replace(/[/\\<>:"|?*\x00-\x1F]/g, "_").trim();
    return name || fallbackFilename(rawUrl);
  } catch {
    return fallbackFilename(rawUrl);
  }
}

/**
 * Ensure a filename is unique within a directory by appending a counter.
 * @param {string} dir - Directory to check.
 * @param {string} filename - Desired filename.
 * @returns {string} Unique filename within the directory.
 */
function uniqueFilename(dir, filename) {
  const ext = path.extname(filename);
  const base = path.basename(filename, ext);
  let candidate = filename;
  let i = 1;
  while (fs.existsSync(path.join(dir, candidate))) {
    candidate = `${base}_${i}${ext}`;
    i++;
  }
  return candidate;
}

module.exports = {
  filenameFromUrl,
  uniqueFilename,
};
