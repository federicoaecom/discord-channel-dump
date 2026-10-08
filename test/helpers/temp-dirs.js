"use strict";

/**
 * Temporary directories for tests, removed in one call.
 *
 * Usage in a node:test file:
 *
 *   const { createTempDirs } = require("./helpers/temp-dirs.js");
 *   const temp = createTempDirs();
 *   afterEach(() => temp.cleanup());
 *
 *   it("...", () => {
 *     const dir = temp.make("app-");
 *   });
 *
 * The caller registers the hook itself, so the cleanup point stays visible in
 * each test file and the helper also works outside node:test (for example in a
 * child-process script). A top-level afterEach in a test file runs after every
 * test in that file, including failing ones.
 */

const fs = require("fs");
const os = require("os");
const path = require("path");

// Windows can briefly hold handles (antivirus, a just-closed browser or child
// process), so retry before giving up.
const RM_OPTIONS = { recursive: true, force: true, maxRetries: 10, retryDelay: 100 };

/**
 * Create a registry of temporary directories.
 * @returns {{ make: (prefix: string) => string, cleanup: () => void }}
 */
function createTempDirs() {
  const dirs = [];

  return {
    /**
     * Create a directory such as `<os.tmpdir()>/<prefix>XXXXXX` and register it.
     * @param {string} prefix Recognizable name prefix, e.g. "app-".
     * @returns {string} The directory path.
     */
    make(prefix) {
      const dir = fs.mkdtempSync(path.join(os.tmpdir(), prefix));
      dirs.push(dir);
      return dir;
    },

    /**
     * Remove every registered directory. Directories that are already gone are
     * ignored. Every directory is attempted; the first failure is rethrown.
     */
    cleanup() {
      let firstError;
      for (const dir of dirs.splice(0)) {
        try {
          fs.rmSync(dir, RM_OPTIONS);
        } catch (error) {
          firstError ??= error;
        }
      }
      if (firstError) throw firstError;
    },
  };
}

module.exports = { createTempDirs };
