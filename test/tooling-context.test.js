const fs = require("node:fs");
const path = require("node:path");
const { describe, it } = require("node:test");
const assert = require("node:assert/strict");

const root = path.resolve(__dirname, "..");
const read = (...segments) => fs.readFileSync(path.join(root, ...segments), "utf8");

function parseWorkflowSteps(workflow) {
  const normalized = workflow.replace(/\r\n/g, "\n");
  const matches = [...normalized.matchAll(/^(\s*)- name:\s*(.+?)\s*$/gm)];

  return matches.map((match, index) => {
    const block = normalized.slice(match.index, matches[index + 1]?.index ?? normalized.length);
    const condition = block.match(/^\s+if:\s*(.+?)\s*$/m)?.[1];
    const shell = block.match(/^\s+shell:\s*(.+?)\s*$/m)?.[1];
    const runMatch = block.match(/^\s+run:\s*(?:\|\s*\n([\s\S]*)|(.*?)\s*$)/m);

    return {
      name: match[2],
      condition,
      shell,
      run: runMatch?.[1] ?? runMatch?.[2] ?? "",
    };
  });
}

function findWorkflowStep(steps, name) {
  const matches = steps.filter((step) => step.name === name);
  assert.equal(matches.length, 1, `workflow must define exactly one "${name}" step`);
  return matches[0];
}

function extractShellFunction(script, name) {
  const escapedName = name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return script.match(
    new RegExp(`(?:^|\\n)\\s*${escapedName}\\(\\) \\{\\n([\\s\\S]*?)^\\s*\\}`, "m")
  )?.[1];
}

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
    const js = require("@eslint/js");
    const eslintConfig = require(path.join(root, "eslint.config.js"));
    const ignoreConfig = eslintConfig.find((entry) => Array.isArray(entry.ignores));
    const commonJsConfig = eslintConfig.find(
      (entry) => entry.languageOptions?.sourceType === "commonjs"
    );

    assert.equal(fs.existsSync(path.join(root, ".eslintrc.json")), false);
    assert.ok(eslintConfig.includes(js.configs.recommended));
    assert.deepEqual(commonJsConfig.files, ["**/*.js"]);
    for (const pattern of [
      "node_modules/**",
      "backups/**",
      "browser-profile/**",
      ".github/**",
      "openspec/**",
      ".atl/**",
      ".codegraph/**",
    ]) {
      assert.ok(ignoreConfig.ignores.includes(pattern), `flat config must ignore ${pattern}`);
    }
    assert.equal(commonJsConfig.languageOptions.globals.process, false);
    assert.deepEqual(commonJsConfig.rules["no-constant-condition"], [
      "error",
      { checkLoops: false },
    ]);
    const prettierIgnore = read(".prettierignore");
    assert.doesNotMatch(prettierIgnore, /^templates\/$/m);
    assert.match(prettierIgnore, /^src\/templates\/viewer\.html$/m);
    assert.doesNotMatch(prettierIgnore, /^(bin|src|test)\/$/m);
  });

  it("pins the supported Node toolchain and CI matrix", () => {
    const pkg = JSON.parse(read("package.json"));
    assert.equal(pkg.engines.node, "^20.19.0 || ^22.13.0 || >=24");
    assert.equal(pkg.dependencies.playwright, "1.62.1");
    assert.equal(pkg.devDependencies.eslint, "10.9.1");
    assert.equal(pkg.devDependencies["@eslint/js"], "10.0.1");
    assert.equal(pkg.devDependencies.globals, "17.12.0");
    assert.equal(pkg.devDependencies.prettier, "3.9.6");

    const ci = read(".github", "workflows", "ci.yml");
    const steps = parseWorkflowSteps(ci);
    assert.match(ci, /node-version: \[20\.19\.0, 22\.13\.0, 24\.x\]/);
    for (const command of [
      "npm ci",
      "npx playwright install chromium",
      "npm run lint",
      "npm run format:check",
      "npm test",
    ]) {
      assert.match(ci, new RegExp(command.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
    }
    const auditStep = findWorkflowStep(steps, "Audit production dependencies");
    const smokeStep = findWorkflowStep(steps, "Verify installed package CLI");
    const cleanup = extractShellFunction(smokeStep.run, "cleanup");

    assert.equal(auditStep.condition, "matrix.node-version == '20.19.0'");
    assert.equal(auditStep.run.trim(), "npm audit --omit=dev");
    assert.equal(smokeStep.condition, "matrix.node-version == '20.19.0'");
    assert.equal(smokeStep.shell, "bash");
    assert.match(smokeStep.run, /--ignore-scripts --no-audit --no-fund/);
    // The CLI speaks Spanish by default; English stays reachable through --lang en.
    assert.match(
      smokeStep.run,
      /"\$install_root\/bin\/discord-channel-dump" --help \| grep -F "Uso:"/
    );
    assert.match(
      smokeStep.run,
      /"\$install_root\/bin\/discord-channel-dump" --lang en --help \| grep -F "Usage:"/
    );
    assert.match(smokeStep.run, /require\(['"]\.\/package\.json['"]\)\.version/);
    assert.match(smokeStep.run, /(?:^|\n)\s*trap cleanup EXIT\s*(?:\n|$)/);
    assert.ok(cleanup, "package smoke must define cleanup() for its temporary artifacts");
    assert.match(cleanup, /rm -f "\$package_file"/);
    assert.match(cleanup, /rm -rf "\$install_root"/);
    assert.match(smokeStep.run, /--version\)" = "\$expected_version"/);
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
