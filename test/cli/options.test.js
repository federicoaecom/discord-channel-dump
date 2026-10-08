const { describe, it, beforeEach, afterEach } = require("node:test");
const assert = require("node:assert/strict");

const { DEFAULT_LANGUAGE, setLanguage } = require("../../src/i18n");
const { parseOptions } = require("../../src/cli/options.js");

const FLAGS = Object.freeze({ "--help": "help", "-h": "help", "--dry-run": "dryRun" });
const VALUES = Object.freeze({ "--output": "output", "-o": "output", "--lang": "lang" });

/**
 * Parse with the test option tables, collecting positional arguments.
 * @param {string[]} argv - Raw arguments.
 * @returns {Object} The parse result.
 */
function parse(argv) {
  return parseOptions(argv, {
    flags: FLAGS,
    valueOptions: VALUES,
    initial: { _: [] },
    onPositional: (arg, result) => {
      result._.push(arg);
    },
  });
}

// Error messages are asserted in English; restore the default afterwards.
beforeEach(() => {
  setLanguage("en");
});

afterEach(() => {
  setLanguage(DEFAULT_LANGUAGE);
});

describe("parseOptions", () => {
  it("starts every flag key at false, keeping the initial fields", () => {
    assert.deepEqual(parse([]), { help: false, dryRun: false, _: [] });
  });

  it("sets flags, including aliases, to true", () => {
    assert.deepEqual(parse(["-h", "--dry-run"]), { help: true, dryRun: true, _: [] });
  });

  it("consumes the next argument as an option value, the last one winning", () => {
    assert.deepEqual(parse(["--output", "a", "-o", "--lang", "--lang", "en"]), {
      help: false,
      dryRun: false,
      output: "--lang",
      lang: "en",
      _: [],
    });
  });

  it("reports a value option without a value", () => {
    assert.deepEqual(parse(["--output"]), { error: "Missing value for --output" });
  });

  it("reports an unknown option", () => {
    assert.deepEqual(parse(["folder", "--foo"]), { error: "Unknown option: --foo" });
  });

  it("passes positional arguments to onPositional, in order", () => {
    assert.deepEqual(parse(["a", "-h", "b"]), { help: true, dryRun: false, _: ["a", "b"] });
  });

  it("returns the error that onPositional reports", () => {
    const result = parseOptions(["x"], {
      flags: FLAGS,
      valueOptions: VALUES,
      onPositional: (arg) => `bad ${arg}`,
    });
    assert.deepEqual(result, { error: "bad x" });
  });
});
