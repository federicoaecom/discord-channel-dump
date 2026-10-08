const { describe, it } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("fs");
const path = require("path");

describe("viewer template", () => {
  const templatePath = path.join(__dirname, "..", "..", "src", "templates", "viewer.html");
  const template = fs.readFileSync(templatePath, "utf8");
  const cspMatch = template.match(
    /<meta[^\u003e]*http-equiv=["']Content-Security-Policy["'][^\u003e]*content="([^"]+)"[^\u003e]*>/i
  );

  it("includes a Content-Security-Policy meta tag", () => {
    assert.ok(cspMatch, "CSP meta tag should exist");
  });

  it("restricts default sources to 'self'", () => {
    assert.match(cspMatch[1], /default-src\s+'self'/i);
  });

  it("allows inline scripts and styles for the static viewer", () => {
    assert.match(cspMatch[1], /script-src[^;]*'unsafe-inline'/i);
    assert.match(cspMatch[1], /style-src[^;]*'unsafe-inline'/i);
  });

  it("blocks network connections and frames", () => {
    assert.match(cspMatch[1], /connect-src\s+'none'/i);
    assert.match(cspMatch[1], /frame-src\s+'none'/i);
  });

  it("takes every user-facing label from placeholders instead of hard-coded text", () => {
    assert.match(template, /<html lang="\{\{LANG\}\}">/);
    assert.match(template, /<title>\{\{TITLE\}\}<\/title>/);
    assert.match(template, /\{\{MESSAGE_COUNT_LABEL\}\} &mdash; \{\{GENERATED_AT\}\}/);
    assert.match(template, /placeholder="\{\{SEARCH_PLACEHOLDER\}\}"/);
    assert.match(template, /<label for="date-from">\{\{DATE_FROM_LABEL\}\}<\/label>/);
    assert.match(template, /<label for="date-to">\{\{DATE_TO_LABEL\}\}<\/label>/);
    assert.match(template, /<button id="clear-btn">\{\{CLEAR_LABEL\}\}<\/button>/);
    // Only the markup: the inline script uses `msgs` as a variable name.
    const markup = template.split("<script>")[0];
    assert.doesNotMatch(markup, /Buscar|Desde|Hasta|Limpiar|msgs/);
  });
});
