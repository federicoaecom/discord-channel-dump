const { describe, it, afterEach } = require("node:test");
const assert = require("node:assert/strict");
const i18n = require("../../src/i18n");
const { generateHtml } = require("../../src/viewer/render.js");

const { DEFAULT_LANGUAGE, setLanguage } = i18n;

// The active language is module-level state; reset it so tests stay independent.
afterEach(() => {
  setLanguage(DEFAULT_LANGUAGE);
});

function message(overrides = {}) {
  return {
    msgId: "1",
    timestamp: "2024-03-15T14:32:00.000Z",
    author: "Alice",
    text: "Hello world",
    localImages: ["images/photo.png"],
    localAttachments: [],
    ...overrides,
  };
}

function messagesOf(count) {
  return Array.from({ length: count }, (_, i) => message({ msgId: String(i + 1) }));
}

function headerMeta(html) {
  const match = html.match(/<span class="header-meta">([^<]*)<\/span>/);
  assert.ok(match, "header-meta span should exist");
  return match[1];
}

describe("generateHtml", () => {
  it("renders the template with an empty message list", () => {
    const html = generateHtml("empty-channel", []);
    assert.match(html, /#empty-channel/);
    assert.match(headerMeta(html), /^0 mensajes &mdash; /);
  });

  it("renders a message with text, author, and timestamp", () => {
    const messages = [
      {
        msgId: "1",
        timestamp: "2024-03-15T14:32:00.000Z",
        author: "Alice",
        text: "Hello world",
        localImages: [],
        localAttachments: [],
      },
    ];
    const html = generateHtml("general", messages);
    assert.match(html, /Alice/);
    assert.match(html, /Hello world/);
    assert.match(headerMeta(html), /^1 mensaje &mdash; /);
  });

  it("escapes HTML in message text and author", () => {
    const messages = [
      {
        msgId: "1",
        timestamp: "2024-03-15T14:32:00.000Z",
        author: "<script>",
        text: "<img src=x onerror=alert(1)>",
        localImages: [],
        localAttachments: [],
      },
    ];
    const html = generateHtml("xss", messages);
    assert.match(html, /&lt;script&gt;/);
    assert.match(html, /&lt;img src=x onerror=alert\(1\)&gt;/);
  });

  it("renders local images and attachments", () => {
    const messages = [
      {
        msgId: "1",
        timestamp: "2024-03-15T14:32:00.000Z",
        author: "Bob",
        text: "",
        localImages: ["images/photo.png"],
        localAttachments: [{ label: "doc.pdf", path: "attachments/doc.pdf" }],
      },
    ];
    const html = generateHtml("files", messages);
    assert.match(html, /images\/photo\.png/);
    assert.match(html, /attachments\/doc\.pdf/);
    assert.match(html, /doc\.pdf/);
  });

  it("adds rel=noopener noreferrer to every target=_blank link", () => {
    const messages = [
      {
        msgId: "1",
        timestamp: "2024-03-15T14:32:00.000Z",
        author: "Bob",
        text: "",
        localImages: ["images/photo.png"],
        localAttachments: [{ label: "doc.pdf", path: "attachments/doc.pdf" }],
      },
    ];
    const html = generateHtml("links", messages);
    const blankLinks = html.match(/\u003ca[^\u003e]*target=["']_blank["'][^\u003e]*\u003e/gi) || [];
    assert.ok(blankLinks.length > 0, "should have target=_blank links");
    for (const link of blankLinks) {
      assert.match(link, /rel=["']noopener noreferrer["']/i);
    }
  });

  it("computes date bounds for the date inputs", () => {
    const messages = [
      {
        msgId: "1",
        timestamp: "2024-01-01T00:00:00.000Z",
        author: "A",
        text: "",
      },
      {
        msgId: "2",
        timestamp: "2024-12-31T00:00:00.000Z",
        author: "B",
        text: "",
      },
    ];
    const html = generateHtml("dates", messages);
    assert.match(html, /min="2024-01-01"/);
    assert.match(html, /max="2024-12-31"/);
  });

  it("leaves no template placeholder unfilled in either language", () => {
    for (const lang of ["es", "en"]) {
      const html = generateHtml("general", [message()], { lang });
      assert.doesNotMatch(html, /\{\{[A-Z_]+\}\}/, lang);
    }
  });
});

describe("generateHtml language", () => {
  it("renders the Spanish viewer by default, with the current wording", () => {
    const html = generateHtml("general", [message()]);
    assert.match(html, /<html lang="es">/);
    assert.match(html, /<title>Backup — #general<\/title>/);
    assert.match(html, /placeholder="Buscar en el chat…"/);
    assert.match(html, /<label for="date-from">Desde<\/label>/);
    assert.match(html, /<label for="date-to">Hasta<\/label>/);
    assert.match(html, /<button id="clear-btn">✕ Limpiar<\/button>/);
    assert.match(html, /alt="imagen"/);
  });

  it("renders the English viewer when options.lang is en", () => {
    const html = generateHtml("general", [message()], { lang: "en" });
    assert.match(html, /<html lang="en">/);
    assert.match(html, /<title>Backup — #general<\/title>/);
    assert.match(html, /placeholder="Search the chat…"/);
    assert.match(html, /<label for="date-from">From<\/label>/);
    assert.match(html, /<label for="date-to">To<\/label>/);
    assert.match(html, /<button id="clear-btn">✕ Clear<\/button>/);
    assert.match(html, /alt="image"/);
    assert.match(headerMeta(html), /^1 message &mdash; /);
    assert.doesNotMatch(html, /Buscar|Desde|Hasta|Limpiar|mensaje/);
  });

  it("defaults to the active language", () => {
    setLanguage("en");
    const html = generateHtml("general", [message()]);
    assert.match(html, /<html lang="en">/);
    assert.match(html, /✕ Clear/);
  });

  it("lets options.lang override the active language", () => {
    setLanguage("en");
    const html = generateHtml("general", [message()], { lang: "es" });
    assert.match(html, /<html lang="es">/);
    assert.match(html, /✕ Limpiar/);
  });

  it("rejects an unsupported language", () => {
    assert.throws(() => generateHtml("general", [], { lang: "fr" }), RangeError);
  });

  for (const [lang, expected] of [
    ["es", ["0 mensajes", "1 mensaje", "2 mensajes"]],
    ["en", ["0 messages", "1 message", "2 messages"]],
  ]) {
    it(`pluralizes the message count in ${lang}`, () => {
      expected.forEach((label, count) => {
        const html = generateHtml("general", messagesOf(count), { lang });
        assert.equal(headerMeta(html).split(" &mdash; ")[0], label);
      });
    });
  }

  for (const [lang, locale] of [
    ["es", "es-AR"],
    ["en", "en-US"],
  ]) {
    it(`formats message dates and the generated-at date with the ${locale} locale`, (t) => {
      const now = new Date("2024-06-01T09:05:00.000Z");
      t.mock.timers.enable({ apis: ["Date"], now });
      const ts = "2024-03-15T14:32:00.000Z";
      const html = generateHtml("general", [message({ timestamp: ts })], { lang });
      t.mock.timers.reset();

      const messageDate = new Date(ts).toLocaleString(locale);
      const generatedAt = now.toLocaleString(locale);
      assert.ok(html.includes(`<span class="date">${messageDate}</span>`), messageDate);
      assert.equal(headerMeta(html).split(" &mdash; ")[1], generatedAt);
    });
  }

  it("keeps the ISO date bounds regardless of the language", () => {
    const messages = [
      message({ timestamp: "2024-01-01T00:00:00.000Z" }),
      message({ timestamp: "2024-12-31T00:00:00.000Z" }),
    ];
    const html = generateHtml("dates", messages, { lang: "en" });
    assert.match(html, /min="2024-01-01"/);
    assert.match(html, /max="2024-12-31"/);
  });
});

describe("generateHtml escaping of translated text", () => {
  it("escapes dictionary values and ignores replacement patterns in them", () => {
    // `$&`, `$1`, "$`" and "$'" are String.prototype.replace patterns.
    const hostile = '<b class="x">$&$1$`$\'</b>';
    const original = i18n.translateIn;
    i18n.translateIn = (lang, key, params) =>
      key.startsWith("viewer.")
        ? `${hostile} ${(params && params.count) ?? ""}`
        : original(lang, key, params);
    let html;
    try {
      html = generateHtml("general", [message()], { lang: "en" });
    } finally {
      i18n.translateIn = original;
    }
    const escaped = "&lt;b class=&quot;x&quot;&gt;$&amp;$1$`$'&lt;/b&gt;";
    assert.doesNotMatch(html, /<b class="x">/);
    assert.ok(html.includes(`<title>${escaped} </title>`), "title");
    assert.ok(html.includes(`placeholder="${escaped} "`), "search placeholder");
    assert.ok(html.includes(`<label for="date-from">${escaped} </label>`), "from label");
    assert.ok(html.includes(`<button id="clear-btn">${escaped} </button>`), "clear button");
    assert.ok(html.includes(`alt="${escaped} "`), "image alt");
    assert.ok(headerMeta(html).startsWith(`${escaped} 1 &mdash; `), "message count");
    assert.doesNotMatch(html, /\{\{[A-Z_]+\}\}/);
  });

  it("does not expand placeholders that appear inside injected values", () => {
    const html = generateHtml(
      "{{ROWS}}",
      [message({ author: "{{CLEAR_LABEL}}", text: "{{MESSAGE_COUNT_LABEL}}" })],
      { lang: "en" }
    );
    assert.match(html, /<h1>#\{\{ROWS\}\}<\/h1>/);
    assert.match(html, /<span class="author">\{\{CLEAR_LABEL\}\}<\/span>/);
    assert.match(html, /<p class="text">\{\{MESSAGE_COUNT_LABEL\}\}<\/p>/);
  });
});
