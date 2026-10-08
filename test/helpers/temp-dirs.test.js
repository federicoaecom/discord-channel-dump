const { describe, it } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("fs");
const os = require("os");
const path = require("path");
const { createTempDirs } = require("./temp-dirs.js");

describe("createTempDirs", () => {
  it("creates a prefixed directory inside the OS temp directory", () => {
    const temp = createTempDirs();
    const dir = temp.make("temp-dirs-");
    try {
      assert.equal(fs.statSync(dir).isDirectory(), true);
      assert.equal(path.dirname(dir), path.resolve(os.tmpdir()));
      assert.match(path.basename(dir), /^temp-dirs-/);
    } finally {
      temp.cleanup();
    }
  });

  it("removes every created directory and its contents on cleanup", () => {
    const temp = createTempDirs();
    const first = temp.make("temp-dirs-");
    const second = temp.make("temp-dirs-");
    fs.mkdirSync(path.join(first, "nested"));
    fs.writeFileSync(path.join(first, "nested", "file.txt"), "x", "utf8");

    temp.cleanup();

    assert.equal(fs.existsSync(first), false);
    assert.equal(fs.existsSync(second), false);
  });

  it("tolerates directories that are already gone and repeated cleanup", () => {
    const temp = createTempDirs();
    const dir = temp.make("temp-dirs-");
    fs.rmSync(dir, { recursive: true, force: true });

    assert.doesNotThrow(() => temp.cleanup());
    assert.doesNotThrow(() => temp.cleanup());
  });

  it("forgets removed directories so a later cleanup only handles new ones", () => {
    const temp = createTempDirs();
    const first = temp.make("temp-dirs-");
    temp.cleanup();

    // A directory recreated at the same path after cleanup is no longer owned.
    fs.mkdirSync(first);
    try {
      const second = temp.make("temp-dirs-");
      temp.cleanup();
      assert.equal(fs.existsSync(second), false);
      assert.equal(fs.existsSync(first), true);
    } finally {
      fs.rmSync(first, { recursive: true, force: true });
    }
  });
});
