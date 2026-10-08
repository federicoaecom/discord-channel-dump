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
  translationsOf,
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

  it("reports an invalid flag with its source and value, keeping a valid env language", () => {
    assert.deepEqual(resolveLanguage({ flag: "xx", env: "en" }), {
      language: "en",
      error: { source: "--lang", value: "xx" },
    });
  });

  it("reports an invalid flag with the default language when env is unset or invalid", () => {
    assert.deepEqual(resolveLanguage({ flag: "xx" }), {
      language: "es",
      error: { source: "--lang", value: "xx" },
    });
    assert.deepEqual(resolveLanguage({ flag: "xx", env: "yy" }), {
      language: "es",
      error: { source: "--lang", value: "xx" },
    });
  });

  it("reports an empty flag value as invalid", () => {
    assert.deepEqual(resolveLanguage({ flag: "" }).error, { source: "--lang", value: "" });
  });

  it("falls back to the default with a warning for an invalid env value", () => {
    assert.deepEqual(resolveLanguage({ env: "fr" }), {
      language: "es",
      warning: { source: "DISCORD_LANG", value: "fr" },
    });
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
  it("uses the active language", () => {
    assert.equal(t("app.done"), es["app.done"]);
    assert.equal(t("app.done"), "Listo.");
    setLanguage("en");
    assert.equal(t("app.done"), en["app.done"]);
    assert.equal(t("app.done"), "Done.");
  });

  it("interpolates params in the active language", () => {
    setLanguage("en");
    assert.equal(t("app.channelId", { id: "123" }), "Channel ID: 123");
  });

  it("returns the key for unknown keys", () => {
    assert.equal(t("no.such.key"), "no.such.key");
  });
});

describe("translationsOf", () => {
  it("returns the key's text in every supported language, in order", () => {
    setLanguage("en");
    assert.deepEqual(translationsOf("app.exitCommand"), ["salir", "exit"]);
  });

  it("falls back like t() for keys missing from a dictionary", () => {
    assert.deepEqual(translationsOf("no.such.key"), ["no.such.key", "no.such.key"]);
  });
});

describe("dictionaries", () => {
  it("es and en have identical key sets", () => {
    assert.deepEqual(Object.keys(es).sort(), Object.keys(en).sort());
  });

  it("use the same placeholders in both languages for every key", () => {
    const placeholders = (text) => [...text.matchAll(/\{(\w+)\}/g)].map((m) => m[1]).sort();
    for (const key of Object.keys(en)) {
      assert.deepEqual(placeholders(es[key]), placeholders(en[key]), key);
    }
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
