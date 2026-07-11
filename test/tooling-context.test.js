const fs = require("node:fs");
const path = require("node:path");
const { describe, it } = require("node:test");
const assert = require("node:assert/strict");

const root = path.resolve(__dirname, "..");
const read = (...segments) => fs.readFileSync(path.join(root, ...segments), "utf8");

describe("professional layout tooling and documentation", () => {
  it("routes package entry points and scripts through bin/", () => {
    const pkg = JSON.parse(read("package.json"));
    assert.equal(pkg.main, "bin/backup.js");
    assert.equal(pkg.bin["discord-channel-dump"], "bin/backup.js");
    assert.equal(pkg.scripts.backup, "node bin/backup.js");
    assert.equal(pkg.scripts.regen, "node bin/regen-html.js");
  });

  it("configures lint and formatting for the new source layout", () => {
    const eslint = JSON.parse(read(".eslintrc.json"));
    assert.ok(eslint.ignorePatterns.includes("openspec/"));
    const prettierIgnore = read(".prettierignore");
    assert.doesNotMatch(prettierIgnore, /^templates\/$/m);
    assert.match(prettierIgnore, /^src\/templates\/viewer\.html$/m);
    assert.doesNotMatch(prettierIgnore, /^(bin|src|test)\/$/m);
  });

  it("documents bin commands and preserved runtime directories", () => {
    for (const file of ["README.md", "AGENTS.md"]) {
      const contents = read(file);
      assert.match(contents, /bin\/backup\.js/);
      assert.match(contents, /bin\/regen-html\.js/);
      assert.match(contents, /runtime directories/i);
      assert.doesNotMatch(contents, /node (?:\.\/)?backup\.js/);
      assert.doesNotMatch(contents, /node (?:\.\/)?regen-html\.js/);
    }
  });

  it("describes the CommonJS bin and src layout with available quality tools", () => {
    const config = read("openspec", "config.yaml");
    assert.match(config, /bin\/ \+ src\/ layout/);
    assert.match(config, /node:test/);
    assert.match(config, /npm run lint/);
    assert.match(config, /npm run format:check/);
    assert.doesNotMatch(config, /No existing test framework, linter, formatter, or CI/);
  });
});
