const fs = require("node:fs");
const path = require("node:path");
const { describe, it } = require("node:test");
const assert = require("node:assert/strict");

const root = path.resolve(__dirname, "..");

function exists(...segments) {
  return fs.existsSync(path.join(root, ...segments));
}

describe("cleanup stale artifacts", () => {
  const staleFiles = [
    "format_output.txt",
    "help_output.txt",
    "lint_output.txt",
    "test_output.txt",
    "logo.png",
  ];

  for (const file of staleFiles) {
    it(`${file} is removed`, () => {
      assert.equal(exists(file), false, `${file} should not be in the workspace root`);
    });
  }

  it("keeps only behavior specs and their config in openspec/", () => {
    for (const required of [["specs"], ["config.yaml"], ["README.md"]]) {
      assert.ok(exists("openspec", ...required), `openspec/${required.join("/")} must exist`);
    }
    for (const stale of ["changes", "reviews"]) {
      assert.equal(exists("openspec", stale), false, `openspec/${stale}/ should be removed`);
    }
  });

  it("keeps optional runtime data directories ignored", () => {
    const ignored = new Set(
      fs
        .readFileSync(path.join(root, ".gitignore"), "utf8")
        .split(/\r?\n/)
        .map((line) => line.trim())
        .filter((line) => line && !line.startsWith("#"))
    );

    assert.ok(ignored.has("backups/"), "backups/ must remain ignored");
    assert.ok(ignored.has("browser-profile/"), "browser-profile/ must remain ignored");
  });
});
