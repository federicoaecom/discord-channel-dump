/**
 * Minimal, dependency-free i18n for user-facing text.
 *
 * The active language is module-level state (like the logger's verbose flag).
 * The CLI entry points resolve it once with `resolveLanguage()` (the `--lang`
 * flag, then the `DISCORD_LANG` env var, then the default) and apply it with
 * `setLanguage()`, through `applyLanguage()` in src/cli/language.js.
 * Everything else reads it through `t()` / `getLocale()`.
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
 * Resolve the language to use: the flag wins, then the env var, then the default.
 * An empty or blank env var counts as unset. The env var is not validated when
 * a valid flag is given.
 *
 * Invalid values never leave the language unresolved, so callers can always
 * report problems in a known language:
 * - An invalid flag is a hard error. `language` is the best language known
 *   for the error message: a valid env value, otherwise the default.
 * - An invalid env var (with no flag) is only a warning, and the default is
 *   used, so a bad global setting does not break every command.
 *
 * Pure: it neither changes the active language nor builds messages.
 * @param {{ flag?: string, env?: string }} [sources] - Raw flag and env values.
 * @returns {{
 *   language: "es" | "en",
 *   error?: { source: "--lang", value: string },
 *   warning?: { source: "DISCORD_LANG", value: string }
 * }} The resolved language plus, at most, one problem description.
 */
function resolveLanguage({ flag, env } = {}) {
  const envIsSet = typeof env === "string" && env.trim() !== "";
  const envLanguage = envIsSet ? normalizeLanguage(env) : null;

  if (flag !== undefined) {
    const flagLanguage = normalizeLanguage(flag);
    if (flagLanguage) {
      return { language: flagLanguage };
    }
    return {
      language: envLanguage ?? DEFAULT_LANGUAGE,
      error: { source: "--lang", value: flag },
    };
  }
  if (envLanguage) {
    return { language: envLanguage };
  }
  if (envIsSet) {
    return {
      language: DEFAULT_LANGUAGE,
      warning: { source: "DISCORD_LANG", value: env },
    };
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
 * Get the BCP 47 locale for date and number formatting.
 * @param {"es" | "en"} [language] - Language to map; defaults to the active one.
 * @returns {string} `es-AR` for Spanish, `en-US` for English.
 */
function getLocale(language = currentLanguage) {
  return LOCALES[language];
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

/**
 * Translate a key in an explicit language, without reading or changing the
 * active one. Used to render output (such as the viewer) in a given language.
 * @param {"es" | "en"} language - Language to look up first.
 * @param {string} key - Message key.
 * @param {Record<string, unknown>} [params] - Placeholder values for `{name}`.
 * @returns {string} The translated, interpolated message.
 */
function translateIn(language, key, params) {
  return translate(DICTIONARIES, language, key, params);
}

/**
 * Pick the plural form of a key for a count: `<key>.one` for exactly 1 and
 * `<key>.other` for everything else, in every supported language.
 *
 * `Intl.PluralRules` is deliberately not used: it returns `many` for Spanish
 * counts such as 1,000,000, which would need a third form per key. The
 * dictionaries define both forms for every plural key.
 * @param {string} key - Base message key, without the `.one` / `.other` suffix.
 * @param {number} count - The count that selects the form.
 * @returns {string} The full message key.
 */
function pluralKey(key, count) {
  return `${key}.${count === 1 ? "one" : "other"}`;
}

/**
 * Translate the plural form of a key for a count in the active language.
 * The count also fills the `{count}` placeholder.
 * @param {string} key - Base message key, without the `.one` / `.other` suffix.
 * @param {number} count - The count that selects the form.
 * @param {Record<string, unknown>} [params] - Other placeholder values.
 * @returns {string} The translated, interpolated message.
 */
function tPlural(key, count, params) {
  return t(pluralKey(key, count), { ...params, count });
}

/**
 * Translate a key in every supported language, regardless of the active one.
 * Useful for input words that must be accepted in any language (for example
 * the quit command), so the accepted set comes from the dictionaries.
 * @param {string} key - Message key.
 * @returns {string[]} One translation per supported language, in display order.
 */
function translationsOf(key) {
  return SUPPORTED_LANGUAGES.map((language) => translate(DICTIONARIES, language, key));
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
  translateIn,
  translationsOf,
  pluralKey,
  tPlural,
  t,
};
