const { describe, it } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");

const {
  sanitize,
  escapeHtml,
  filenameFromUrl,
  uniqueFilename,
  iconFor,
  generateHtml,
} = require("../src/utils.js");

describe("sanitize", () => {
  it("replaces illegal filename characters and trims channel names", () => {
    assert.equal(sanitize("# foo/bar | baz"), "foo_bar _ baz");
  });

  it("trims leading and trailing whitespace", () => {
    assert.equal(sanitize("  hello world  "), "hello world");
  });
});

describe("escapeHtml", () => {
  it("escapes HTML special characters", () => {
    assert.equal(escapeHtml('<script>&"'), "&lt;script&gt;&amp;&quot;");
  });

  it("handles null and undefined as empty strings", () => {
    assert.equal(escapeHtml(null), "");
    assert.equal(escapeHtml(undefined), "");
  });
});

describe("filenameFromUrl", () => {
  it("extracts the filename from a URL path", () => {
    const name = filenameFromUrl("https://example.com/path/to/image.png?size=128");
    assert.equal(name, "image.png");
  });

  it("returns a fallback name for an invalid URL", () => {
    const name = filenameFromUrl("not-a-url");
    assert.match(name, /^file_/);
  });
});

describe("uniqueFilename", () => {
  it("returns the original filename when there is no collision", () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "unique-"));
    assert.equal(uniqueFilename(dir, "file.txt"), "file.txt");
  });

  it("appends an increment when the filename already exists", () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "unique-"));
    fs.writeFileSync(path.join(dir, "file.txt"), "x");
    fs.writeFileSync(path.join(dir, "file_1.txt"), "x");
    assert.equal(uniqueFilename(dir, "file.txt"), "file_2.txt");
  });
});

describe("iconFor", () => {
  it("returns a known icon for .pdf files", () => {
    assert.equal(iconFor("report.PDF"), "📄");
  });

  it("returns a fallback paperclip icon for unknown extensions", () => {
    assert.equal(iconFor("unknown.abc"), "📎");
  });
});

describe("generateHtml", () => {
  it("renders the template with an empty message list", () => {
    const html = generateHtml("test-channel", []);
    assert.match(html, /#test-channel/);
    assert.match(html, /0 msgs/);
    assert.doesNotMatch(html, /\{\{CHANNEL_NAME\}\}/);
    assert.doesNotMatch(html, /\{\{MESSAGE_COUNT\}\}/);
    assert.doesNotMatch(html, /\{\{ROWS\}\}/);
  });

  it("renders a message with text, author, and timestamp", () => {
    const messages = [
      {
        timestamp: "2024-01-15T10:30:00.000Z",
        author: "Alice",
        text: "Hello world",
        localImages: [],
        localAttachments: [],
      },
    ];
    const html = generateHtml("test-channel", messages);
    assert.match(html, /Alice/);
    assert.match(html, /Hello world/);
    assert.match(html, /2024/);
  });
});
