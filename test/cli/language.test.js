const { describe, it, afterEach } = require("node:test");
const assert = require("node:assert/strict");

const { DEFAULT_LANGUAGE, setLanguage, getLanguage } = require("../../src/i18n");
const { applyLanguage, findLangFlag, languageHelpParams } = require("../../src/cli/language");

// The active language is module-level state; reset it so tests stay independent.
afterEach(() => {
  setLanguage(DEFAULT_LANGUAGE);
});

function collectWarnings() {
  const warnings = [];
  return { warnings, warn: (message) => warnings.push(String(message)) };
}

describe("findLangFlag", () => {
  it("returns undefined when --lang is absent", () => {
    assert.equal(findLangFlag([]), undefined);
    assert.equal(findLangFlag(["--help", "backups/x"]), undefined);
  });

  it("returns the value that follows --lang", () => {
    assert.equal(findLangFlag(["--lang", "en"]), "en");
    assert.equal(findLangFlag(["--dry-run", "--lang", "xx", "--help"]), "xx");
  });

  it("finds --lang even after an argument the parser would reject", () => {
    assert.equal(findLangFlag(["--foo", "--lang", "en"]), "en");
  });

  it("lets the last --lang win, like the parser", () => {
    assert.equal(findLangFlag(["--lang", "es", "--lang", "en"]), "en");
  });

  it("ignores a trailing --lang without a value", () => {
    assert.equal(findLangFlag(["--lang"]), undefined);
  });
});

describe("applyLanguage", () => {
  it("applies the default language when neither flag nor env is set", () => {
    setLanguage("en");
    const { warnings, warn } = collectWarnings();
    assert.deepEqual(applyLanguage({ warn }), { language: "es" });
    assert.equal(getLanguage(), "es");
    assert.deepEqual(warnings, []);
  });

  it("applies a valid env value", () => {
    const { warnings, warn } = collectWarnings();
    assert.deepEqual(applyLanguage({ env: "EN", warn }), { language: "en" });
    assert.equal(getLanguage(), "en");
    assert.deepEqual(warnings, []);
  });

  it("lets a valid flag win and skips env validation", () => {
    const { warnings, warn } = collectWarnings();
    assert.deepEqual(applyLanguage({ flag: "en", env: "xx", warn }), { language: "en" });
    assert.equal(getLanguage(), "en");
    assert.deepEqual(warnings, []);
  });

  it("warns about an invalid env value and falls back to the default", () => {
    setLanguage("en");
    const { warnings, warn } = collectWarnings();
    const result = applyLanguage({ env: "xx", warn });
    assert.deepEqual(result, { language: "es" });
    assert.equal(getLanguage(), "es");
    assert.equal(warnings.length, 1);
    // The warning is written in the language that will be used (the default).
    assert.match(warnings[0], /^Advertencia: valor no válido para DISCORD_LANG: "xx"/);
    assert.match(warnings[0], /Valores admitidos: es, en/);
  });

  it("returns an error for an invalid flag, translated with the valid env language", () => {
    const { warnings, warn } = collectWarnings();
    const result = applyLanguage({ flag: "xx", env: "en", warn });
    assert.equal(result.language, undefined);
    assert.equal(result.error, 'Invalid value for --lang: "xx". Supported values: es, en.');
    assert.equal(getLanguage(), "en");
    assert.deepEqual(warnings, []);
  });

  it("returns an error for an invalid flag in the default language when env is unusable", () => {
    const { warnings, warn } = collectWarnings();
    const result = applyLanguage({ flag: "xx", env: "yy", warn });
    assert.equal(result.error, 'Valor no válido para --lang: "xx". Valores admitidos: es, en.');
    assert.equal(getLanguage(), "es");
    assert.deepEqual(warnings, []);
  });

  it("treats an empty flag as invalid", () => {
    const result = applyLanguage({ flag: "", warn: () => {} });
    assert.match(result.error, /--lang/);
  });
});

describe("languageHelpParams", () => {
  it("derives the supported list and default from the i18n module", () => {
    assert.deepEqual(languageHelpParams(), { supported: "es, en", default: "es" });
  });
});
