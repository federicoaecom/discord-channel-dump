/**
 * CLI argument parsing and help/version output for bin/backup.js
 */

"use strict";

const pkg = require("../../package.json");

const logger = require("../ui/logger");

/**
 * Print the CLI help message.
 */
function printHelp() {
  logger.info(`
Usage: node bin/backup.js [options]

Options:
  -h, --help            Show this help message
  -v, --version         Show version
  -o, --output <dir>    Backup output directory
  -p, --profile <dir>   Browser profile directory
      --lang <code>     Interface language: es (default) or en
                        (overrides the DISCORD_LANG env var)
      --verbose         Enable debug output
      --dry-run         Fetch message count without saving files

Examples:
  node bin/backup.js
  node bin/backup.js --output ./my-backups
  node bin/backup.js --profile ./my-profile --output ./my-backups
  node bin/backup.js --dry-run
  node bin/backup.js --lang en
`);
}

/**
 * Print the CLI version.
 */
function printVersion() {
  logger.info(pkg.version);
}

/**
 * Parse command-line arguments for bin/backup.js.
 * @param {string[]} argv - Raw CLI arguments (excluding node and script path).
 * @returns {{ help: boolean, version: boolean, verbose: boolean, dryRun: boolean, output?: string, profile?: string, lang?: string } | { error: string }}
 *   Parsed options or an error object. `lang` is the raw `--lang` value; it is
 *   validated by `resolveLanguage` in src/i18n.
 */
function parseCliArgs(argv) {
  const result = { help: false, version: false, verbose: false, dryRun: false };
  let i = 0;
  while (i < argv.length) {
    const arg = argv[i];
    if (arg === "--help" || arg === "-h") {
      result.help = true;
    } else if (arg === "--version" || arg === "-v") {
      result.version = true;
    } else if (arg === "--verbose") {
      result.verbose = true;
    } else if (arg === "--dry-run") {
      result.dryRun = true;
    } else if (arg === "--output" || arg === "-o") {
      if (i + 1 >= argv.length) {
        return { error: `Missing value for ${arg}` };
      }
      result.output = argv[++i];
    } else if (arg === "--profile" || arg === "-p") {
      if (i + 1 >= argv.length) {
        return { error: `Missing value for ${arg}` };
      }
      result.profile = argv[++i];
    } else if (arg === "--lang") {
      if (i + 1 >= argv.length) {
        return { error: `Missing value for ${arg}` };
      }
      result.lang = argv[++i];
    } else if (arg.startsWith("-")) {
      return { error: `Unknown option: ${arg}` };
    } else {
      return { error: `Unexpected argument: ${arg}` };
    }
    i++;
  }
  return result;
}

module.exports = {
  parseCliArgs,
  printHelp,
  printVersion,
};
