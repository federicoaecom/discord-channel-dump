/**
 * CLI argument parsing and help/version output for bin/backup.js
 */

"use strict";

const pkg = require("../../package.json");

const logger = require("../ui/logger");
const { t } = require("../i18n");
const { LANG_OPTION, languageHelpParams } = require("./language");

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
 * Options that take the next argument as their value, mapped to the result key
 * they fill. bin/backup.js passes the keys to `findLangFlag()` so it skips
 * option values exactly like this parser does.
 */
const VALUE_OPTIONS = Object.freeze({
  "--output": "output",
  "-o": "output",
  "--profile": "profile",
  "-p": "profile",
  [LANG_OPTION]: "lang",
});

/**
 * Parse command-line arguments for bin/backup.js.
 * @param {string[]} argv - Raw CLI arguments (excluding node and script path).
 * @returns {{ help: boolean, version: boolean, verbose: boolean, dryRun: boolean, output?: string, profile?: string, lang?: string } | { error: string }}
 *   Parsed options or an error object whose message uses the active language.
 *   `lang` is the raw `--lang` value. The entry point does not read it: it
 *   applies the language before parsing, with `findLangFlag()` and the same
 *   `VALUE_OPTIONS`, so even argument errors are translated. Both always agree
 *   when parsing succeeds. The parser still accepts `--lang` so the option and
 *   its value are consumed instead of reported as unknown or unexpected.
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
    } else if (Object.hasOwn(VALUE_OPTIONS, arg)) {
      if (i + 1 >= argv.length) {
        return { error: t("cli.args.missingValue", { option: arg }) };
      }
      result[VALUE_OPTIONS[arg]] = argv[++i];
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
  VALUE_OPTIONS,
  parseCliArgs,
  printHelp,
  printVersion,
};
