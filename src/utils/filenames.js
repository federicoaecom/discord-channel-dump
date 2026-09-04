/**
 * Media filename and cache-identity helpers.
 *
 * This module owns basename extraction, digest generation, UTF-8 byte bounds,
 * and cache identity for downloaded media.
 */

"use strict";

const { createHash } = require("crypto");
const fs = require("fs");
const path = require("path");

const MAX_MEDIA_FILENAME_BYTES = 255;

// Volatile Discord CDN signing parameters. They rotate without changing the
// underlying bytes, so they are excluded from cache identity. Matching is
// case-insensitive; every other query parameter keeps resources distinct.
const VOLATILE_MEDIA_QUERY_PARAMS = new Set(["ex", "is", "hm"]);

function fallbackFilename(rawUrl) {
  const digest = createHash("sha256").update(String(rawUrl)).digest("hex");
  return `file_${BigInt(`0x${digest}`).toString(10)}`;
}

/**
 * Derive the stable cache identity for a media URL.
 *
 * The identity is `origin + pathname` plus the remaining (non-volatile)
 * query parameters in sorted order. URL fragments are ignored because they
 * are never sent to the server.
 * @param {string} rawUrl - Source URL.
 * @returns {string} Canonical identity used for digest generation and reuse.
 */
function canonicalMediaIdentity(rawUrl) {
  try {
    const parsed = new URL(String(rawUrl));
    const params = new URLSearchParams(parsed.search);
    for (const key of [...params.keys()]) {
      if (VOLATILE_MEDIA_QUERY_PARAMS.has(key.toLowerCase())) {
        params.delete(key);
      }
    }
    params.sort();
    const query = params.toString();
    return `${parsed.origin}${parsed.pathname}${query ? `?${query}` : ""}`;
  } catch {
    return String(rawUrl);
  }
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

function truncateUtf8(value, maxBytes) {
  let result = "";
  let byteLength = 0;

  for (const codePoint of value) {
    const codePointBytes = Buffer.byteLength(codePoint, "utf8");
    if (byteLength + codePointBytes > maxBytes) break;
    result += codePoint;
    byteLength += codePointBytes;
  }

  return result;
}

function appendSourceHash(filename, identity) {
  const ext = path.extname(filename);
  const base = path.basename(filename, ext);
  const hash = createHash("sha256").update(identity).digest("hex");
  const hashSuffix = `_${hash}`;
  const preservedExt =
    Buffer.byteLength(hashSuffix + ext, "utf8") <= MAX_MEDIA_FILENAME_BYTES ? ext : "";
  const maxBaseBytes =
    MAX_MEDIA_FILENAME_BYTES - Buffer.byteLength(hashSuffix + preservedExt, "utf8");
  return `${truncateUtf8(base, maxBaseBytes)}${hashSuffix}${preservedExt}`;
}

/**
 * Derive the stable on-disk filename for a media URL.
 *
 * The basename comes from the URL path while the digest comes from the
 * canonical cache identity, so rotating CDN signatures reuse the same file
 * and meaningful query parameters stay distinct.
 * @param {string} rawUrl - Source URL.
 * @returns {string} Stable filename within 255 UTF-8 bytes.
 */
function mediaFilenameFromUrl(rawUrl) {
  return appendSourceHash(filenameFromUrl(rawUrl), canonicalMediaIdentity(rawUrl));
}

module.exports = {
  filenameFromUrl,
  uniqueFilename,
  canonicalMediaIdentity,
  mediaFilenameFromUrl,
};
