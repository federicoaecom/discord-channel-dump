const { describe, it } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("fs");
const os = require("os");
const path = require("path");
const { filenameFromUrl, uniqueFilename } = require("../../src/utils/filenames.js");

describe("filenameFromUrl", () => {
  it("extracts the filename from a URL path", () => {
    assert.equal(filenameFromUrl("https://cdn.example.com/path/photo.png?size=100"), "photo.png");
  });

  it("decodes percent-encoded characters", () => {
    assert.equal(filenameFromUrl("https://example.com/file%20name.txt"), "file name.txt");
  });

  it("returns a fallback name for an invalid URL", () => {
    const result = filenameFromUrl("not-a-url");
    assert.match(result, /^file_\d+$/);
    assert.equal(filenameFromUrl("not-a-url"), result);
  });

  it("replaces illegal characters in the decoded filename", () => {
    assert.equal(filenameFromUrl("https://example.com/bad:name.txt"), "bad_name.txt");
  });
});

describe("uniqueFilename", () => {
  it("returns the original filename when there is no collision", () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "unique-"));
    assert.equal(uniqueFilename(dir, "photo.png"), "photo.png");
  });

  it("appends an increment when the filename already exists", () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "unique-"));
    fs.writeFileSync(path.join(dir, "photo.png"), "x");
    assert.equal(uniqueFilename(dir, "photo.png"), "photo_1.png");
    fs.writeFileSync(path.join(dir, "photo_1.png"), "x");
    assert.equal(uniqueFilename(dir, "photo.png"), "photo_2.png");
  });

  it("works for filenames without an extension", () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "unique-"));
    fs.writeFileSync(path.join(dir, "file"), "x");
    assert.equal(uniqueFilename(dir, "file"), "file_1");
  });
});
