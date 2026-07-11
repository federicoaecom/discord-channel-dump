/* global window */

const { describe, it } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("fs");
const os = require("os");
const path = require("path");
const { chromium } = require("playwright");
const { generateHtml } = require("../src/viewer/render.js");

const xssPayload = '<img src=x onerror="window.xss=1"> hello';

async function loadViewerPage(messages) {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "viewer-"));
  const htmlPath = path.join(tmpDir, "index.html");
  fs.writeFileSync(htmlPath, generateHtml("xss-channel", messages), "utf8");

  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.goto("file:///" + htmlPath.replace(/\\/g, "/"));
  return { browser, page, tmpDir };
}

async function closeViewer({ browser, tmpDir }) {
  await browser.close();
  fs.rmSync(tmpDir, { recursive: true, force: true });
}

describe("viewer DOM-safe highlight", () => {
  it("does not execute scripts from message text during search", async () => {
    const messages = [
      {
        timestamp: "2024-01-15T10:00:00.000Z",
        author: "Alice",
        text: xssPayload,
        localImages: [],
        localAttachments: [],
      },
      {
        timestamp: "2024-01-15T10:01:00.000Z",
        author: "Bob",
        text: "regex test .*",
        localImages: [],
        localAttachments: [],
      },
    ];

    const { browser, page, tmpDir } = await loadViewerPage(messages);
    try {
      assert.equal(await page.evaluate(() => window.xss), undefined);

      await page.fill("#search", "img");
      await page.waitForTimeout(100);
      assert.equal(await page.evaluate(() => window.xss), undefined);

      await page.fill("#search", ".*");
      await page.waitForTimeout(100);
      const count = await page.textContent("#search-count");
      assert.match(count, /1\s*\/\s*2/);

      const markText = await page.locator(".matched mark").textContent();
      assert.equal(markText, ".*");
    } finally {
      await closeViewer({ browser, tmpDir });
    }
  });

  it("clear button resets search and match count", async () => {
    const messages = [
      {
        timestamp: "2024-01-15T10:00:00.000Z",
        author: "Alice",
        text: "searchable text",
        localImages: [],
        localAttachments: [],
      },
    ];

    const { browser, page, tmpDir } = await loadViewerPage(messages);
    try {
      await page.fill("#search", "searchable");
      await page.waitForTimeout(100);
      assert.match(await page.textContent("#search-count"), /1\s*\/\s*1/);
      assert.equal(await page.locator(".msg.matched mark").count(), 1);

      await page.click("#clear-btn");
      await page.waitForTimeout(100);
      assert.equal(await page.textContent("#search-count"), "");
      assert.equal(await page.locator(".msg.matched").count(), 0);
      assert.equal(await page.locator("mark").count(), 0);
    } finally {
      await closeViewer({ browser, tmpDir });
    }
  });
});
