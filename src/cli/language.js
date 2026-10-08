/**
 * Shared language bootstrap for the CLI entry points (bin/backup.js and
 * bin/regen-html.js).
 *
 * The entry points apply the language before parsing the rest of argv, so
 * every message they print, including argument errors and help, uses it.
 */

"use strict";

const logger = require("../ui/logger");
const {
  SUPPORTED_LANGUAGES,
  DEFAULT_LANGUAGE,
  resolveLanguage,
  setLanguage,
  t,
} = require("../i18n");

/**
 * Find the raw `--lang` value in argv without fully parsing it.
 *
 * This lets the entry points select the language before the argument parser
 * reports errors, even when an invalid argument comes before `--lang`. Like
 * the parsers, the last `--lang` wins. A trailing `--lang` without a value is
 * ignored here; the parser reports it as a missing value.
 * @param {string[]} argv - Raw CLI arguments (excluding node and script path).
 * @returns {string | undefined} The raw value, or undefined when absent.
 */
function findLangFlag(argv) {
  let value;
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === "--lang" && i + 1 < argv.length) {
      value = argv[++i];
    }
  }
  return value;
}

/**
 * Placeholder values that describe the language options in help text.
 * @returns {{ supported: string, default: string }} Supported codes and the default.
 */
function languageHelpParams() {
  return { supported: SUPPORTED_LANGUAGES.join(", "), default: DEFAULT_LANGUAGE };
}

/**
 * Resolve and apply the interface language.
 *
 * - A valid flag or env value is applied; a valid flag skips env validation.
 * - An invalid env value prints a warning through `warn` and the default is applied.
 * - An invalid flag returns an error message for the caller to report and exit on.
 *
 * Problems are always reported in the best language already known (a valid
 * flag or env value, otherwise the default), which is applied before the
 * message is built.
 * @param {{ flag?: string, env?: string, warn?: (message: string) => void }} [options]
 *   Raw `--lang` and `DISCORD_LANG` values, and the warning sink (stderr by default).
 * @returns {{ language: "es" | "en" } | { error: string }} The applied language,
 *   or a translated error message for an invalid flag.
 */
function applyLanguage({ flag, env, warn = logger.warn } = {}) {
  const resolved = resolveLanguage({ flag, env });
  setLanguage(resolved.language);

  const { supported } = languageHelpParams();
  if (resolved.error) {
    return { error: t("cli.language.invalid", { ...resolved.error, supported }) };
  }
  if (resolved.warning) {
    warn(
      t("cli.language.invalidEnvWarning", {
        ...resolved.warning,
        supported,
        default: DEFAULT_LANGUAGE,
      })
    );
  }
  return { language: resolved.language };
}

module.exports = {
  applyLanguage,
  findLangFlag,
  languageHelpParams,
};
