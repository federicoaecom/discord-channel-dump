/**
 * Regenerate index.html for an existing backup folder using the
 * current generateHtml logic (search + date range filter).
 *
 * Usage:
 *   node bin/regen-html.js [options] <path-to-backup-folder>
 *
 * Options:
 *   -h, --help        Show this help message
 *   -v, --version     Show version
 *       --lang <code> Interface language (see --help for the supported values)
 *
 * Examples:
 *   node bin/regen-html.js backups/channel-name
 *   node bin/regen-html.js --help
 */

"use strict";

const fs = require("fs");
const path = require("path");
const pkg = require("../package.json");
const logger = require("../src/ui/logger");
const { t, getLanguage } = require("../src/i18n");
const {
  LANG_OPTION,
  applyLanguage,
  findLangFlag,
  languageHelpParams,
} = require("../src/cli/language");
const { generateHtml } = require("../src/viewer/render");

function printHelp() {
  logger.info(`\n${t("cli.regen.help", languageHelpParams())}\n`);
}

function printVersion() {
  logger.info(pkg.version);
}

/**
 * Options that take the next argument as their value, mapped to the result key
 * they fill. `main()` passes the keys to `findLangFlag()` so it skips option
 * values exactly like this parser does.
 */
const VALUE_OPTIONS = Object.freeze({ [LANG_OPTION]: "lang" });

/**
 * Parse command-line arguments for bin/regen-html.js.
 * @param {string[]} argv - Raw CLI arguments (excluding node and script path).
 * @returns {{ help: boolean, version: boolean, lang?: string, _: string[] } | { error: string }}
 *   Parsed options or an error object whose message uses the active language.
 *   `lang` is the raw `--lang` value. `main()` does not read it: it applies the
 *   language before parsing, with `findLangFlag()` and the same `VALUE_OPTIONS`,
 *   so even argument errors are translated. Both always agree when parsing
 *   succeeds. The parser still accepts `--lang` so the option and its value are
 *   consumed instead of reported as unknown or taken as the backup folder.
 */
function parseCliArgs(argv) {
  const result = { help: false, version: false, _: [] };
  let i = 0;
  while (i < argv.length) {
    const arg = argv[i];
    if (arg === "--help" || arg === "-h") {
      result.help = true;
    } else if (arg === "--version" || arg === "-v") {
      result.version = true;
    } else if (Object.hasOwn(VALUE_OPTIONS, arg)) {
      if (i + 1 >= argv.length) {
        return { error: t("cli.args.missingValue", { option: arg }) };
      }
      result[VALUE_OPTIONS[arg]] = argv[++i];
    } else if (arg.startsWith("-")) {
      return { error: t("cli.args.unknownOption", { option: arg }) };
    } else {
      result._.push(arg);
    }
    i++;
  }
  return result;
}

async function main(argv) {
  // Apply the language before parsing so help and every error, including
  // argument errors that come before --lang, are printed in it.
  const lang = applyLanguage({
    flag: findLangFlag(argv, Object.keys(VALUE_OPTIONS)),
    env: process.env.DISCORD_LANG,
  });
  if (lang.error) {
    logger.error(t("cli.error", { message: lang.error }));
    printHelp();
    process.exit(1);
  }

  const args = parseCliArgs(argv);
  if (args.error) {
    logger.error(t("cli.error", { message: args.error }));
    printHelp();
    process.exit(1);
  }
  if (args.help) {
    printHelp();
    process.exit(0);
  }
  if (args.version) {
    printVersion();
    process.exit(0);
  }

  const target = args._[0];
  if (!target) {
    logger.error(t("cli.error", { message: t("cli.regen.missingFolder") }));
    printHelp();
    process.exit(1);
  }

  const jsonPath = path.resolve(target, "messages.json");
  const htmlPath = path.resolve(target, "index.html");

  if (!fs.existsSync(jsonPath)) {
    logger.error(t("cli.regen.notFound", { path: jsonPath }));
    process.exit(1);
  }

  let messages;
  try {
    messages = JSON.parse(fs.readFileSync(jsonPath, "utf8"));
  } catch (e) {
    logger.error(
      t("cli.error", {
        message: t("cli.regen.parseError", { path: jsonPath, reason: e.message }),
      })
    );
    process.exit(1);
  }

  const channelName = path.basename(path.resolve(target));

  // The viewer uses the language applied above (--lang, then DISCORD_LANG).
  fs.writeFileSync(htmlPath, generateHtml(channelName, messages, { lang: getLanguage() }), "utf8");
  logger.info(`  ${t("cli.regen.done", { path: htmlPath, count: messages.length })}`);
}

if (require.main === module) {
  main(process.argv.slice(2)).catch((err) => {
    logger.error(t("cli.fatalError"), err.message);
    process.exit(1);
  });
}

module.exports = { VALUE_OPTIONS, parseCliArgs };
