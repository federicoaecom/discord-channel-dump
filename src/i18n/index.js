/**
 * Minimal, dependency-free i18n for user-facing text.
 *
 * The active language is module-level state (like the logger's verbose flag).
 * The CLI entry points resolve it once with `resolveLanguage()` (the `--lang`
 * flag, then the `DISCORD_LANG` env var, then the default) and apply it with
 * `setLanguage()`. Everything else reads it through `t()` / `getLocale()`.
 *
 * Tests that change the language must restore it, for example with
 * `afterEach(() => setLanguage(DEFAULT_LANGUAGE))`.
 */

"use strict";

const es = require("./es");
const en = require("./en");

/** Supported language codes, in display order. */
const SUPPORTED_LANGUAGES = Object.freeze(["es", "en"]);

/** Language used when neither the flag nor the env var selects one. */
const DEFAULT_LANGUAGE = "es";

/** Language used when a key is missing from the active dictionary. */
const FALLBACK_LANGUAGE = "en";

const DICTIONARIES = Object.freeze({ es, en });

const LOCALES = Object.freeze({ es: "es-AR", en: "en-US" });

let currentLanguage = DEFAULT_LANGUAGE;

/**
 * Normalize a user-supplied language code.
 * Only exact codes are accepted (no region suffixes such as `es-AR`).
 * @param {unknown} value - Raw value from a flag, env var, or config.
 * @returns {"es" | "en" | null} The canonical code, or null when unsupported.
 */
function normalizeLanguage(value) {
  if (typeof value !== "string") {
    return null;
  }
  const code = value.trim().toLowerCase();
  return SUPPORTED_LANGUAGES.includes(code) ? code : null;
}

/**
 * Build the error message for an unsupported language value.
 * @param {string} source - Where the value came from (`--lang` or `DISCORD_LANG`).
 * @param {string} value - The rejected raw value.
 * @returns {string} Human-readable error message.
 */
function invalidLanguageMessage(source, value) {
  return `Invalid value for ${source}: "${value}". Supported values: ${SUPPORTED_LANGUAGES.join(", ")}.`;
}

/**
 * Resolve the language to use: the flag wins, then the env var, then the default.
 * An empty or blank env var counts as unset. The env var is not validated when
 * a valid flag is given.
 * @param {{ flag?: string, env?: string }} [sources] - Raw flag and env values.
 * @returns {{ language: "es" | "en" } | { error: string }} The resolved language
 *   or an error naming the offending source and value.
 */
function resolveLanguage({ flag, env } = {}) {
  if (flag !== undefined) {
    const language = normalizeLanguage(flag);
    return language ? { language } : { error: invalidLanguageMessage("--lang", flag) };
  }
  if (typeof env === "string" && env.trim() !== "") {
    const language = normalizeLanguage(env);
    return language ? { language } : { error: invalidLanguageMessage("DISCORD_LANG", env) };
  }
  return { language: DEFAULT_LANGUAGE };
}

/**
 * Set the active language.
 * @param {"es" | "en"} language - A canonical supported code.
 * @throws {RangeError} When the code is not supported.
 */
function setLanguage(language) {
  if (!SUPPORTED_LANGUAGES.includes(language)) {
    throw new RangeError(`Unsupported language: ${language}`);
  }
  currentLanguage = language;
}

/**
 * Get the active language.
 * @returns {"es" | "en"} The active language code.
 */
function getLanguage() {
  return currentLanguage;
}

/**
 * Get the BCP 47 locale for date and number formatting in the active language.
 * @returns {string} `es-AR` for Spanish, `en-US` for English.
 */
function getLocale() {
  return LOCALES[currentLanguage];
}

/**
 * Replace `{name}` placeholders with values from `params`.
 * Placeholders without a matching param are left untouched.
 * @param {string} template - Message template.
 * @param {Record<string, unknown>} [params] - Placeholder values.
 * @returns {string} The interpolated message.
 */
function interpolate(template, params) {
  if (!params) {
    return template;
  }
  return template.replace(/\{(\w+)\}/g, (match, name) =>
    Object.prototype.hasOwnProperty.call(params, name) ? String(params[name]) : match
  );
}

/**
 * Translate a key against explicit dictionaries. Pure; used by `t()` and tests.
 * Falls back to English, then to the key itself.
 * @param {Record<string, Record<string, string>>} dictionaries - Dictionaries by language.
 * @param {string} language - Language to look up first.
 * @param {string} key - Message key.
 * @param {Record<string, unknown>} [params] - Placeholder values.
 * @returns {string} The translated, interpolated message.
 */
function translate(dictionaries, language, key, params) {
  const lookup = (lang) => {
    const dict = dictionaries[lang];
    return dict && Object.prototype.hasOwnProperty.call(dict, key) ? dict[key] : undefined;
  };
  const template = lookup(language) ?? lookup(FALLBACK_LANGUAGE) ?? key;
  return interpolate(template, params);
}

/**
 * Translate a key in the active language.
 * @param {string} key - Message key.
 * @param {Record<string, unknown>} [params] - Placeholder values for `{name}`.
 * @returns {string} The translated, interpolated message.
 */
function t(key, params) {
  return translate(DICTIONARIES, currentLanguage, key, params);
}

module.exports = {
  SUPPORTED_LANGUAGES,
  DEFAULT_LANGUAGE,
  normalizeLanguage,
  resolveLanguage,
  setLanguage,
  getLanguage,
  getLocale,
  translate,
  t,
};
