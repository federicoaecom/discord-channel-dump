const { describe, it } = require("node:test");
const assert = require("node:assert/strict");
const { renderProgressBar, formatBytes, formatEta } = require("../../src/ui/progress.js");

describe("renderProgressBar", () => {
  it("renders a 0% bar", () => {
    assert.match(renderProgressBar(0), /\[░+\]\s+0%/);
  });

  it("renders a 100% bar", () => {
    const bar = renderProgressBar(100);
    assert.match(bar, /\[█+\]\s+100%/);
    assert.doesNotMatch(bar, /░/);
  });

  it("renders a partial bar", () => {
    const bar = renderProgressBar(50, { width: 10 });
    assert.match(bar, /\[█████░░░░░\]\s+50%/);
  });

  it("includes a label when provided", () => {
    const bar = renderProgressBar(25, { label: "Downloading" });
    assert.match(bar, /Downloading/);
  });
});

describe("formatBytes", () => {
  it("formats bytes", () => {
    assert.equal(formatBytes(0), "0 B");
    assert.equal(formatBytes(512), "512 B");
  });

  it("formats kilobytes", () => {
    assert.match(formatBytes(1536), /1\.5 KB/);
  });

  it("formats megabytes", () => {
    assert.match(formatBytes(2 * 1024 * 1024), /2\.0 MB/);
  });
});

describe("formatEta", () => {
  it("formats seconds", () => {
    assert.equal(formatEta(5000), "5s");
  });

  it("formats minutes", () => {
    assert.equal(formatEta(90 * 1000), "1m 30s");
  });

  it("formats hours", () => {
    assert.equal(formatEta(2 * 60 * 60 * 1000 + 5 * 60 * 1000), "2h 5m");
  });

  it("returns 0s for zero or negative", () => {
    assert.equal(formatEta(0), "0s");
    assert.equal(formatEta(-1000), "0s");
  });
});
