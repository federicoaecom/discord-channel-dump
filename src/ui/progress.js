/**
 * Terminal progress bar helpers.
 */

"use strict";

/**
 * Render an ANSI progress bar string.
 * @param {number} percent - Completion percentage (0-100).
 * @param {{ width?: number, label?: string }} [options] - Bar options.
 * @returns {string} Formatted progress bar.
 */
function renderProgressBar(percent, options = {}) {
  const width = options.width || 20;
  const label = options.label || "";
  const filled = Math.round((Math.max(0, Math.min(100, percent)) / 100) * width);
  const empty = width - filled;
  const bar = "█".repeat(filled) + "░".repeat(empty);
  const prefix = label ? `${label} ` : "";
  return `${prefix}[${bar}] ${percent.toFixed(0)}%`;
}

/**
 * Format a byte count as a human-readable string.
 * @param {number} bytes - Byte count.
 * @returns {string} Formatted string like "1.5 MB".
 */
function formatBytes(bytes) {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  const value = bytes / Math.pow(k, i);
  return `${i === 0 ? value : value.toFixed(1)} ${sizes[i]}`;
}

/**
 * Format milliseconds as a concise ETA string.
 * @param {number} ms - Milliseconds remaining.
 * @returns {string} Formatted string like "2m 30s".
 */
function formatEta(ms) {
  if (ms <= 0) return "0s";
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  if (hours > 0) return `${hours}h ${minutes % 60}m`;
  if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
  return `${seconds}s`;
}

module.exports = { renderProgressBar, formatBytes, formatEta };
