/**
 * Backwards-compatible barrel that re-exports the focused utility modules.
 *
 * Includes sanitize, html, filenames, icons, fs helpers, and the viewer HTML
 * generator. Prefer importing directly from the focused module for new code.
 *
 * @module utils
 */

"use strict";

module.exports = {
  ...require("./utils/sanitize"),
  ...require("./utils/html"),
  ...require("./utils/filenames"),
  ...require("./utils/icons"),
  ...require("./utils/fs"),
  ...require("./viewer/render"),
};
