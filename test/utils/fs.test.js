const { describe, it, afterEach } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("fs");
const path = require("path");
const { ensureDir } = require("../../src/utils/fs.js");
const { createTempDirs } = require("../helpers/temp-dirs.js");

const temp = createTempDirs();

afterEach(() => {
  temp.cleanup();
});

describe("ensureDir", () => {
  it("creates a directory that does not exist", () => {
    const dir = temp.make("ensure-dir-");
    const nested = path.join(dir, "a", "b");
    ensureDir(nested);
    assert.equal(fs.existsSync(nested), true);
  });

  it("does nothing when the directory already exists", () => {
    const dir = temp.make("ensure-dir-");
    ensureDir(dir);
    assert.equal(fs.existsSync(dir), true);
  });
});
