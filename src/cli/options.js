/**
 * Shared argv tokenizer for the CLI entry points (bin/backup.js and
 * bin/regen-html.js). Each command keeps its own option tables.
 */

"use strict";

const { t } = require("../i18n");

/**
 * Parse command-line arguments against a command's option tables.
 *
 * - Every key in `flags` sets its result field to true; all flag fields start false.
 * - Every option in `valueOptions` consumes the next argument as its value,
 *   even when it starts with `-`; the last occurrence wins. `findLangFlag()`
 *   relies on this, so pass it the same `valueOptions` keys.
 * - Any other argument starting with `-` is an unknown option.
 * - Everything else goes to `onPositional`, which may return an error message.
 * @param {string[]} argv - Raw CLI arguments (excluding node and script path).
 * @param {{
 *   flags: Record<string, string>,
 *   valueOptions: Record<string, string>,
 *   onPositional: (arg: string, result: Object) => string | undefined,
 *   initial?: Object
 * }} spec - Option tables mapping each option to its result field, the
 *   positional handler, and extra initial result fields.
 * @returns {Object | { error: string }} The parsed options, or an error
 *   object whose message uses the active language.
 */
function parseOptions(argv, { flags, valueOptions, onPositional, initial = {} }) {
  const result = { ...initial };
  for (const field of Object.values(flags)) {
    result[field] = false;
  }
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (Object.hasOwn(flags, arg)) {
      result[flags[arg]] = true;
    } else if (Object.hasOwn(valueOptions, arg)) {
      if (i + 1 >= argv.length) {
        return { error: t("cli.args.missingValue", { option: arg }) };
      }
      result[valueOptions[arg]] = argv[++i];
    } else if (arg.startsWith("-")) {
      return { error: t("cli.args.unknownOption", { option: arg }) };
    } else {
      const error = onPositional(arg, result);
      if (error) {
        return { error };
      }
    }
  }
  return result;
}

module.exports = { parseOptions };
