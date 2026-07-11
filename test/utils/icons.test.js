const { describe, it } = require("node:test");
const assert = require("node:assert/strict");
const { iconFor } = require("../../src/utils/icons.js");

describe("iconFor", () => {
  it("returns a known icon for .pdf files", () => {
    assert.equal(iconFor("document.pdf"), "📄");
  });

  it("returns a known icon for .xlsx files", () => {
    assert.equal(iconFor("sheet.xlsx"), "📊");
  });

  it("returns a known icon for .mp4 files", () => {
    assert.equal(iconFor("video.mp4"), "🎬");
  });

  it("returns a fallback paperclip icon for unknown extensions", () => {
    assert.equal(iconFor("unknown.xyz"), "📎");
  });

  it("is case-insensitive", () => {
    assert.equal(iconFor("DOC.PDF"), "📄");
  });
});
