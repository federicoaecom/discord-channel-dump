const { describe, it, afterEach } = require("node:test");
const assert = require("node:assert/strict");

const i18n = require("../../src/i18n");
const es = require("../../src/i18n/es");
const en = require("../../src/i18n/en");

const {
  SUPPORTED_LANGUAGES,
  DEFAULT_LANGUAGE,
  normalizeLanguage,
  resolveLanguage,
  setLanguage,
  getLanguage,
  getLocale,
  translate,
  t,
} = i18n;

// The active language is module-level state; reset it so tests stay independent.
afterEach(() => {
  setLanguage(DEFAULT_LANGUAGE);
});

describe("i18n constants", () => {
  it("supports exactly Spanish and English, defaulting to Spanish", () => {
    assert.deepEqual(SUPPORTED_LANGUAGES, ["es", "en"]);
    assert.equal(DEFAULT_LANGUAGE, "es");
  });
});

describe("normalizeLanguage", () => {
  it("accepts supported codes, trimming and lowercasing them", () => {
    assert.equal(normalizeLanguage("es"), "es");
    assert.equal(normalizeLanguage("en"), "en");
    assert.equal(normalizeLanguage(" EN "), "en");
    assert.equal(normalizeLanguage("Es"), "es");
  });

  it("rejects unsupported codes, region suffixes, and non-strings", () => {
    assert.equal(normalizeLanguage("fr"), null);
    assert.equal(normalizeLanguage("es-AR"), null);
    assert.equal(normalizeLanguage("en_US"), null);
    assert.equal(normalizeLanguage(""), null);
    assert.equal(normalizeLanguage(undefined), null);
    assert.equal(normalizeLanguage(null), null);
    assert.equal(normalizeLanguage(1), null);
  });
});

describe("resolveLanguage", () => {
  it("falls back to the default when neither flag nor env is set", () => {
    assert.deepEqual(resolveLanguage({}), { language: "es" });
    assert.deepEqual(resolveLanguage(), { language: "es" });
  });

  it("uses the env value when no flag is given", () => {
    assert.deepEqual(resolveLanguage({ env: "en" }), { language: "en" });
    assert.deepEqual(resolveLanguage({ env: " EN " }), { language: "en" });
  });

  it("treats an empty or blank env value as unset", () => {
    assert.deepEqual(resolveLanguage({ env: "" }), { language: "es" });
    assert.deepEqual(resolveLanguage({ env: "   " }), { language: "es" });
  });

  it("lets the flag win over the env value", () => {
    assert.deepEqual(resolveLanguage({ flag: "es", env: "en" }), { language: "es" });
    assert.deepEqual(resolveLanguage({ flag: "en", env: "es" }), { language: "en" });
  });

  it("does not validate the env value when a valid flag is given", () => {
    assert.deepEqual(resolveLanguage({ flag: "en", env: "xx" }), { language: "en" });
  });

  it("reports an invalid flag value with its source and the supported values", () => {
    const result = resolveLanguage({ flag: "xx", env: "en" });
    assert.equal(result.language, undefined);
    assert.match(result.error, /--lang/);
    assert.match(result.error, /"xx"/);
    assert.match(result.error, /es, en/);
  });

  it("reports an empty flag value as invalid", () => {
    const result = resolveLanguage({ flag: "" });
    assert.match(result.error, /--lang/);
  });

  it("reports an invalid env value with its source and the supported values", () => {
    const result = resolveLanguage({ env: "fr" });
    assert.equal(result.language, undefined);
    assert.match(result.error, /DISCORD_LANG/);
    assert.match(result.error, /"fr"/);
    assert.match(result.error, /es, en/);
  });
});

describe("setLanguage / getLanguage", () => {
  it("defaults to Spanish", () => {
    assert.equal(getLanguage(), "es");
  });

  it("switches the active language", () => {
    setLanguage("en");
    assert.equal(getLanguage(), "en");
  });

  it("rejects unsupported values and keeps the current language", () => {
    setLanguage("en");
    assert.throws(() => setLanguage("fr"), /Unsupported language: fr/);
    assert.throws(() => setLanguage(undefined), /Unsupported language/);
    assert.equal(getLanguage(), "en");
  });
});

describe("getLocale", () => {
  it("maps es to es-AR and en to en-US", () => {
    assert.equal(getLocale(), "es-AR");
    setLanguage("en");
    assert.equal(getLocale(), "en-US");
  });
});

describe("translate", () => {
  const dictionaries = {
    es: { greeting: "Hola, {name}", count: "{n} de {n}" },
    en: { greeting: "Hello, {name}", count: "{n} of {n}", onlyEnglish: "Only {thing}" },
  };

  it("looks up the key in the requested language", () => {
    assert.equal(translate(dictionaries, "es", "greeting", { name: "Ana" }), "Hola, Ana");
    assert.equal(translate(dictionaries, "en", "greeting", { name: "Ana" }), "Hello, Ana");
  });

  it("replaces every occurrence of a placeholder", () => {
    assert.equal(translate(dictionaries, "es", "count", { n: 3 }), "3 de 3");
  });

  it("leaves unknown placeholders untouched", () => {
    assert.equal(translate(dictionaries, "es", "greeting"), "Hola, {name}");
    assert.equal(translate(dictionaries, "es", "greeting", { other: "x" }), "Hola, {name}");
  });

  it("falls back to English when the key is missing in the requested language", () => {
    assert.equal(translate(dictionaries, "es", "onlyEnglish", { thing: "here" }), "Only here");
  });

  it("falls back to the key itself when no dictionary has it", () => {
    assert.equal(translate(dictionaries, "es", "missing.key"), "missing.key");
  });
});

describe("t", () => {
  it("uses the active language with the seed dictionaries", () => {
    assert.equal(t("language.en"), es["language.en"]);
    setLanguage("en");
    assert.equal(t("language.en"), en["language.en"]);
  });

  it("returns the key for unknown keys", () => {
    assert.equal(t("no.such.key"), "no.such.key");
  });
});

describe("dictionaries", () => {
  it("es and en have identical key sets", () => {
    assert.deepEqual(Object.keys(es).sort(), Object.keys(en).sort());
  });

  it("contain only non-empty string values", () => {
    for (const dict of [es, en]) {
      for (const [key, value] of Object.entries(dict)) {
        assert.equal(typeof value, "string", key);
        assert.notEqual(value.length, 0, key);
      }
    }
  });
});
