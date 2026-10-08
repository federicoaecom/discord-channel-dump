const { describe, it, beforeEach, afterEach } = require("node:test");
const assert = require("node:assert/strict");
const pkg = require("../../package.json");

const { DEFAULT_LANGUAGE, setLanguage } = require("../../src/i18n");
const { parseCliArgs, printHelp, printVersion } = require("../../src/cli/backup-args.js");

function captureHelp() {
  let captured = "";
  const original = console.log;
  console.log = (chunk) => {
    captured += chunk;
  };
  try {
    printHelp();
  } finally {
    console.log = original;
  }
  return captured;
}

describe("backup-args", () => {
  // Most assertions pin English; the Spanish default is covered explicitly below.
  beforeEach(() => {
    setLanguage("en");
  });

  afterEach(() => {
    setLanguage(DEFAULT_LANGUAGE);
  });

  describe("parseCliArgs", () => {
    it("returns default flags when no args are passed", () => {
      const args = parseCliArgs([]);
      assert.deepEqual(args, { help: false, version: false, verbose: false, dryRun: false });
    });

    it("parses --help and -h", () => {
      assert.deepEqual(parseCliArgs(["--help"]), {
        help: true,
        version: false,
        verbose: false,
        dryRun: false,
      });
      assert.deepEqual(parseCliArgs(["-h"]), {
        help: true,
        version: false,
        verbose: false,
        dryRun: false,
      });
    });

    it("parses --version and -v", () => {
      assert.deepEqual(parseCliArgs(["--version"]), {
        help: false,
        version: true,
        verbose: false,
        dryRun: false,
      });
      assert.deepEqual(parseCliArgs(["-v"]), {
        help: false,
        version: true,
        verbose: false,
        dryRun: false,
      });
    });

    it("parses --verbose", () => {
      assert.deepEqual(parseCliArgs(["--verbose"]), {
        help: false,
        version: false,
        verbose: true,
        dryRun: false,
      });
    });

    it("parses --dry-run", () => {
      assert.deepEqual(parseCliArgs(["--dry-run"]), {
        help: false,
        version: false,
        verbose: false,
        dryRun: true,
      });
    });

    it("parses --output and --profile", () => {
      const args = parseCliArgs(["--output", "./out", "--profile", "./prof"]);
      assert.deepEqual(args, {
        help: false,
        version: false,
        verbose: false,
        dryRun: false,
        output: "./out",
        profile: "./prof",
      });
    });

    it("returns an error for unknown options", () => {
      const args = parseCliArgs(["--foo"]);
      assert.equal(args.error, "Unknown option: --foo");
    });

    it("returns an error for unexpected arguments", () => {
      const args = parseCliArgs(["extra"]);
      assert.equal(args.error, "Unexpected argument: extra");
    });

    it("returns an error when a flag value is missing", () => {
      const output = parseCliArgs(["--output"]);
      assert.equal(output.error, "Missing value for --output");
      const profile = parseCliArgs(["-p"]);
      assert.equal(profile.error, "Missing value for -p");
    });

    it("parses --lang with a value", () => {
      assert.deepEqual(parseCliArgs(["--lang", "en"]), {
        help: false,
        version: false,
        verbose: false,
        dryRun: false,
        lang: "en",
      });
    });

    it("returns an error when --lang has no value", () => {
      assert.equal(parseCliArgs(["--lang"]).error, "Missing value for --lang");
    });

    it("passes an invalid --lang value through for resolveLanguage to reject", () => {
      // Validation lives in src/i18n resolveLanguage so flag and env share one rule.
      assert.equal(parseCliArgs(["--lang", "xx"]).lang, "xx");
    });
  });

  describe("Spanish default", () => {
    it("reports argument errors in Spanish", () => {
      setLanguage("es");
      assert.equal(parseCliArgs(["--foo"]).error, "Opción desconocida: --foo");
      assert.equal(parseCliArgs(["extra"]).error, "Argumento inesperado: extra");
      assert.equal(parseCliArgs(["--output"]).error, "Falta el valor de --output");
    });
  });

  describe("printHelp", () => {
    it("prints usage to stdout", () => {
      const captured = captureHelp();
      assert.match(captured, /^\nUsage: node bin\/backup\.js \[options\]\n/);
      assert.match(captured, /--help/);
      assert.match(captured, /--lang <code>/);
    });

    it("derives the language list and default from the i18n module", () => {
      const captured = captureHelp();
      assert.match(captured, /--lang <code> {5}Interface language: es, en \(default: es\)/);
    });

    it("prints Spanish help when the language is Spanish", () => {
      setLanguage("es");
      const captured = captureHelp();
      assert.match(captured, /^\nUso: node bin\/backup\.js \[opciones\]\n/);
      assert.match(captured, /Opciones:/);
      assert.match(captured, /Idioma de la interfaz: es, en \(predeterminado: es\)/);
      assert.doesNotMatch(captured, /Usage:/);
    });
  });

  describe("printVersion", () => {
    it("prints the package version to stdout", () => {
      let captured = "";
      const original = console.log;
      console.log = (chunk) => {
        captured += chunk;
      };
      try {
        printVersion();
        assert.equal(captured.trim(), pkg.version);
      } finally {
        console.log = original;
      }
    });
  });
});
