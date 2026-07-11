const { describe, it } = require("node:test");
const assert = require("node:assert/strict");
const pkg = require("../../package.json");

const { parseCliArgs, printHelp, printVersion } = require("../../src/cli/backup-args.js");

describe("backup-args", () => {
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
  });

  describe("printHelp", () => {
    it("prints usage to stdout", () => {
      let captured = "";
      const original = console.log;
      console.log = (chunk) => {
        captured += chunk;
      };
      try {
        printHelp();
        assert.match(captured, /Usage:/);
        assert.match(captured, /--help/);
      } finally {
        console.log = original;
      }
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
