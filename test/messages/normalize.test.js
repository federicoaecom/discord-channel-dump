const { describe, it } = require("node:test");
const assert = require("node:assert/strict");
const { normalizeMessage } = require("../../src/messages/normalize.js");

describe("normalizeMessage", () => {
  it("returns a minimal object for an empty message", () => {
    const result = normalizeMessage({ id: "1", timestamp: "2024-01-01T00:00:00.000Z" });
    assert.deepEqual(result, {
      msgId: "1",
      timestamp: "2024-01-01T00:00:00.000Z",
      author: null,
      text: "",
      images: [],
      attachments: [],
    });
  });

  it("extracts author global_name or username", () => {
    const withGlobal = normalizeMessage({
      id: "2",
      author: { global_name: "Display", username: "user" },
    });
    assert.equal(withGlobal.author, "Display");

    const withoutGlobal = normalizeMessage({
      id: "3",
      author: { username: "user" },
    });
    assert.equal(withoutGlobal.author, "user");
  });

  it("extracts image attachments and non-image attachments", () => {
    const result = normalizeMessage({
      id: "4",
      content: "check this",
      attachments: [
        { filename: "photo.png", url: "https://cdn.example.com/photo.png" },
        { filename: "doc.pdf", url: "https://cdn.example.com/doc.pdf" },
      ],
    });

    assert.equal(result.text, "check this");
    assert.deepEqual(result.images, ["https://cdn.example.com/photo.png"]);
    assert.deepEqual(result.attachments, [
      { label: "doc.pdf", url: "https://cdn.example.com/doc.pdf" },
    ]);
  });

  it("extracts images from embeds", () => {
    const result = normalizeMessage({
      id: "5",
      embeds: [
        { image: { url: "https://cdn.example.com/img1.png" } },
        { thumbnail: { url: "https://cdn.example.com/thumb.png" } },
      ],
    });

    assert.deepEqual(result.images, [
      "https://cdn.example.com/img1.png",
      "https://cdn.example.com/thumb.png",
    ]);
  });

  it("extracts video attachments from embeds", () => {
    const result = normalizeMessage({
      id: "6",
      embeds: [{ video: { url: "https://cdn.example.com/video.mp4" } }],
    });

    assert.deepEqual(result.attachments, [
      { label: "video", url: "https://cdn.example.com/video.mp4" },
    ]);
  });

  it("prefers attachment url over proxy_url", () => {
    const result = normalizeMessage({
      id: "7",
      attachments: [{ filename: "file.txt", proxy_url: "https://proxy.example.com/file.txt" }],
    });

    assert.deepEqual(result.attachments, [
      { label: "file.txt", url: "https://proxy.example.com/file.txt" },
    ]);
  });

  it("skips attachments without a url", () => {
    const result = normalizeMessage({
      id: "8",
      attachments: [{ filename: "missing.txt" }],
    });

    assert.deepEqual(result.images, []);
    assert.deepEqual(result.attachments, []);
  });
});
