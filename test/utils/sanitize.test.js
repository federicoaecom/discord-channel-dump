const { describe, it } = require("node:test");
const assert = require("node:assert/strict");
const { sanitize } = require("../../src/utils/sanitize.js");

describe("sanitize", () => {
  it("replaces illegal Windows filename characters with underscores", () => {
    assert.equal(sanitize("a:b|c?d*e\x00f"), "a_b_c_d_e_f");
  });

  it("replaces slashes with underscores", () => {
    assert.equal(sanitize("channel/name"), "channel_name");
    assert.equal(sanitize("channel\\name"), "channel_name");
  });

  it("trims leading and trailing whitespace", () => {
    assert.equal(sanitize("  hello  "), "hello");
  });

  it("strips leading hash marks used as Markdown headers", () => {
    assert.equal(sanitize("# channel"), "channel");
    assert.equal(sanitize("## channel"), "channel");
  });

  it("returns an empty string when given only whitespace", () => {
    assert.equal(sanitize("   "), "");
  });
});
