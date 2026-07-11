const { describe, it } = require("node:test");
const assert = require("node:assert/strict");
const { generateHtml } = require("../../src/viewer/render.js");

describe("generateHtml", () => {
  it("renders the template with an empty message list", () => {
    const html = generateHtml("empty-channel", []);
    assert.match(html, /#empty-channel/);
    assert.match(html, /0 msgs/);
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
    assert.match(html, /1 msgs/);
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
});
