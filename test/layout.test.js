const fs = require("node:fs");
const path = require("node:path");
const { describe, it } = require("node:test");
const assert = require("node:assert/strict");

const root = path.resolve(__dirname, "..");

function exists(...segments) {
  return fs.existsSync(path.join(root, ...segments));
}

describe("professional directory layout", () => {
  it("places CLI entries in bin/", () => {
    assert.equal(exists("bin", "backup.js"), true);
    assert.equal(exists("bin", "regen-html.js"), true);
  });

  it("places library modules in src/", () => {
    assert.equal(exists("src", "config.js"), true);
    assert.equal(exists("src", "utils.js"), true);
    assert.equal(exists("src", "downloader.js"), true);
    assert.equal(exists("src", "cancel-token.js"), true);
  });

  it("places the viewer template in src/templates/", () => {
    assert.equal(exists("src", "templates", "viewer.html"), true);
  });

  it("places the interrupt helper in test/helpers/", () => {
    assert.equal(exists("test", "helpers", "run-interrupt.js"), true);
  });

  it("removes root-level CLI entries", () => {
    assert.equal(exists("backup.js"), false);
    assert.equal(exists("regen-html.js"), false);
  });

  it("removes root-level library modules", () => {
    assert.equal(exists("config.js"), false);
    assert.equal(exists("utils.js"), false);
    assert.equal(exists("downloader.js"), false);
    assert.equal(exists("cancel-token.js"), false);
  });

  it("removes legacy templates/ and scripts/ directories", () => {
    assert.equal(exists("templates"), false);
    assert.equal(exists("scripts"), false);
  });

  it("leaves the workspace root with only authored project files and runtime data", () => {
    const allowed = new Set([
      "bin",
      "src",
      "test",
      "package.json",
      "package-lock.json",
      ".eslintrc.json",
      ".prettierrc",
      ".prettierignore",
      ".gitignore",
      ".npmignore",
      ".github",
      "README.md",
      "AGENTS.md",
      "LICENSE",
      "CHANGELOG.md",
      "CONTRIBUTING.md",
      "openspec",
      "backups",
      "browser-profile",
      // Reinstalled only to execute this suite after cleanup.
      "node_modules",
    ]);

    const entries = fs.readdirSync(root);
    for (const entry of entries) {
      assert.ok(
        allowed.has(entry),
        `${entry} should not remain in the workspace root after restructuring`
      );
    }
  });
});
