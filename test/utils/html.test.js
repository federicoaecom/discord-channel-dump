const { describe, it } = require("node:test");
const assert = require("node:assert/strict");
const { escapeHtml } = require("../../src/utils/html.js");

describe("escapeHtml", () => {
  it("escapes HTML special characters", () => {
    assert.equal(
      escapeHtml("<script>alert('x')</script>"),
      "&lt;script&gt;alert('x')&lt;/script&gt;"
    );
  });

  it("escapes double quotes", () => {
    assert.equal(escapeHtml('value="x"'), "value=&quot;x&quot;");
  });

  it("handles null and undefined as empty strings", () => {
    assert.equal(escapeHtml(null), "");
    assert.equal(escapeHtml(undefined), "");
  });

  it("returns the input unchanged when no escaping is needed", () => {
    assert.equal(escapeHtml("plain text 123"), "plain text 123");
  });
});
