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

  const generatedDirs = [".codegraph", ".atl"];
  for (const dir of generatedDirs) {
    it(`${dir} is removed`, () => {
      assert.equal(exists(dir), false, `${dir} should not be in the workspace root`);
    });
  }

  it("superseded SDD change is removed if it existed", () => {
    assert.equal(
      exists("openspec", "changes", "post-hardening-improvements"),
      false,
      "post-hardening-improvements directory should be removed"
    );
  });

  it("preserves runtime data directories", () => {
    assert.equal(exists("backups"), true, "backups/ must be preserved");
    assert.equal(exists("browser-profile"), true, "browser-profile/ must be preserved");
  });
});
