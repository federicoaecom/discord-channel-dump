const { describe, it } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("fs");
const os = require("os");
const path = require("path");
const { ensureDir } = require("../../src/utils/fs.js");

describe("ensureDir", () => {
  it("creates a directory that does not exist", () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "ensure-dir-"));
    const nested = path.join(dir, "a", "b");
    ensureDir(nested);
    assert.equal(fs.existsSync(nested), true);
  });

  it("does nothing when the directory already exists", () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "ensure-dir-"));
    ensureDir(dir);
    assert.equal(fs.existsSync(dir), true);
  });
});
