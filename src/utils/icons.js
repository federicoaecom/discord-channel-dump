/**
 * Icon mapping by file extension.
 */

"use strict";

/**
 * Return an emoji icon for a file based on its extension.
 * @param {string} filename - Filename with extension.
 * @returns {string} Emoji icon.
 */
function iconFor(filename) {
  const ext = require("path").extname(filename).toLowerCase();
  return (
    {
      ".pdf": "📄",
      ".doc": "📝",
      ".docx": "📝",
      ".xls": "📊",
      ".xlsx": "📊",
      ".ppt": "📑",
      ".pptx": "📑",
      ".zip": "🗜️",
      ".rar": "🗜️",
      ".7z": "🗜️",
      ".mp4": "🎬",
      ".mov": "🎬",
      ".avi": "🎬",
      ".mkv": "🎬",
      ".mp3": "🎵",
      ".wav": "🎵",
      ".ogg": "🎵",
      ".flac": "🎵",
      ".txt": "📃",
      ".csv": "📋",
      ".json": "📋",
      ".xml": "📋",
      ".exe": "⚙️",
      ".msi": "⚙️",
    }[ext] || "📎"
  );
}

module.exports = { iconFor };
