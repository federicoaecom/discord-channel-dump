const fs = require("node:fs");
const path = require("node:path");
const { describe, it } = require("node:test");
const assert = require("node:assert/strict");

const root = path.resolve(__dirname, "..");
const read = (...segments) => fs.readFileSync(path.join(root, ...segments), "utf8");

function attributesForPattern(contents, pattern) {
  const matches = contents
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith("#"))
    .map((line) => line.split(/\s+/))
    .filter(([candidate]) => candidate === pattern);

  assert.equal(matches.length, 1, `.gitattributes must define exactly one ${pattern} rule`);
  return new Set(matches[0].slice(1));
}
describe("professional layout tooling and documentation", () => {
  it("routes package entry points and scripts through bin/", () => {
    const pkg = JSON.parse(read("package.json"));
    assert.equal(pkg.main, "bin/backup.js");
    assert.equal(pkg.bin["discord-channel-dump"], "bin/backup.js");
    assert.equal(pkg.scripts.backup, "node bin/backup.js");
    assert.equal(pkg.scripts.regen, "node bin/regen-html.js");
  });

  it("declares an executable npm bin with a portable Node shebang", () => {
    const pkg = JSON.parse(read("package.json"));
    const target = pkg.bin["discord-channel-dump"];
    const targetPath = path.join(root, target);
    const shebang = "#!/usr/bin/env node\n";
    const expectedPrefix = Buffer.from(shebang);
    const targetBytes = fs.readFileSync(targetPath);
    const binAttributes = attributesForPattern(read(".gitattributes"), "bin/*.js");

    assert.equal(target, "bin/backup.js");
    assert.equal(fs.existsSync(targetPath), true, `${target} must exist`);
    assert.ok(binAttributes.has("text"), "bin/*.js must be declared as text in .gitattributes");
    assert.ok(binAttributes.has("eol=lf"), ".gitattributes must preserve LF for bin/*.js");
    assert.equal(
      targetBytes.subarray(0, 3).equals(Buffer.from([0xef, 0xbb, 0xbf])),
      false,
      `${target} must not start with a UTF-8 BOM; its shebang must begin at byte zero`
    );
    assert.deepEqual(
      targetBytes.subarray(0, expectedPrefix.length),
      expectedPrefix,
      `${target} must start at byte zero with ${JSON.stringify(shebang)}; .gitattributes guarantees LF`
    );

    if (process.platform !== "win32") {
      assert.notEqual(fs.statSync(targetPath).mode & 0o111, 0, `${target} must be executable`);
    }
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
