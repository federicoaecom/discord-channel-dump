const { describe, it, afterEach } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("fs");
const path = require("path");
const {
  filenameFromUrl,
  uniqueFilename,
  canonicalMediaIdentity,
  mediaFilenameFromUrl,
} = require("../../src/utils/filenames.js");
const { createTempDirs } = require("../helpers/temp-dirs.js");

const temp = createTempDirs();

afterEach(() => {
  temp.cleanup();
});

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

describe("canonicalMediaIdentity", () => {
  it("ignores rotating Discord CDN signature parameters", () => {
    const first = canonicalMediaIdentity(
      "https://cdn.discordapp.com/attachments/1/2/photo.png?ex=111&is=aaa&hm=xxx"
    );
    const second = canonicalMediaIdentity(
      "https://cdn.discordapp.com/attachments/1/2/photo.png?hm=yyy&ex=222&is=bbb"
    );

    assert.equal(first, "https://cdn.discordapp.com/attachments/1/2/photo.png");
    assert.equal(second, first);
  });

  it("keeps meaningful query parameters distinct and order-insensitive", () => {
    assert.notEqual(
      canonicalMediaIdentity("https://cdn.example.com/photo.png?size=100"),
      canonicalMediaIdentity("https://cdn.example.com/photo.png?size=200")
    );
    assert.equal(
      canonicalMediaIdentity("https://cdn.example.com/photo.png?b=2&a=1"),
      canonicalMediaIdentity("https://cdn.example.com/photo.png?a=1&b=2")
    );
  });

  it("ignores fragments and keeps unrelated resources distinct", () => {
    assert.equal(
      canonicalMediaIdentity("https://cdn.example.com/photo.png#fragment"),
      "https://cdn.example.com/photo.png"
    );
    assert.notEqual(
      canonicalMediaIdentity("https://a.example.com/photo.png"),
      canonicalMediaIdentity("https://b.example.com/photo.png")
    );
  });

  it("falls back to the raw value for an invalid URL", () => {
    assert.equal(canonicalMediaIdentity("not-a-url"), "not-a-url");
  });
});

describe("mediaFilenameFromUrl", () => {
  it("produces stable filenames across rotating signatures", () => {
    const first = mediaFilenameFromUrl(
      "https://cdn.discordapp.com/attachments/1/2/photo.png?ex=111&is=aaa&hm=xxx"
    );
    const second = mediaFilenameFromUrl(
      "https://cdn.discordapp.com/attachments/1/2/photo.png?ex=222&is=bbb&hm=yyy"
    );

    assert.equal(second, first);
    assert.match(first, /^photo_[0-9a-f]{64}\.png$/);
  });

  it("bounds long names to 255 UTF-8 bytes", () => {
    const filename = mediaFilenameFromUrl(`https://cdn.example.com/${"a".repeat(300)}.png`);

    assert.equal(Buffer.byteLength(filename, "utf8"), 255);
  });
});

describe("uniqueFilename", () => {
  it("returns the original filename when there is no collision", () => {
    const dir = temp.make("unique-");
    assert.equal(uniqueFilename(dir, "photo.png"), "photo.png");
  });

  it("appends an increment when the filename already exists", () => {
    const dir = temp.make("unique-");
    fs.writeFileSync(path.join(dir, "photo.png"), "x");
    assert.equal(uniqueFilename(dir, "photo.png"), "photo_1.png");
    fs.writeFileSync(path.join(dir, "photo_1.png"), "x");
    assert.equal(uniqueFilename(dir, "photo.png"), "photo_2.png");
  });

  it("works for filenames without an extension", () => {
    const dir = temp.make("unique-");
    fs.writeFileSync(path.join(dir, "file"), "x");
    assert.equal(uniqueFilename(dir, "file"), "file_1");
  });
});
