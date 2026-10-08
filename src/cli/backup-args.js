/**
 * CLI argument parsing and help/version output for bin/backup.js
 */

"use strict";

const pkg = require("../../package.json");

const logger = require("../ui/logger");
const { t } = require("../i18n");
const { languageHelpParams } = require("./language");

/**
 * Print the CLI help message in the active language.
 */
function printHelp() {
  logger.info(`\n${t("cli.backup.help", languageHelpParams())}\n`);
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
 *   Parsed options or an error object whose message uses the active language.
 *   `lang` is the raw `--lang` value; it is validated by `resolveLanguage` in
 *   src/i18n.
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
        return { error: t("cli.args.missingValue", { option: arg }) };
      }
      result.output = argv[++i];
    } else if (arg === "--profile" || arg === "-p") {
      if (i + 1 >= argv.length) {
        return { error: t("cli.args.missingValue", { option: arg }) };
      }
      result.profile = argv[++i];
    } else if (arg === "--lang") {
      if (i + 1 >= argv.length) {
        return { error: t("cli.args.missingValue", { option: arg }) };
      }
      result.lang = argv[++i];
    } else if (arg.startsWith("-")) {
      return { error: t("cli.args.unknownOption", { option: arg }) };
    } else {
      return { error: t("cli.args.unexpectedArgument", { argument: arg }) };
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
