const { describe, it, afterEach } = require("node:test");
const assert = require("node:assert/strict");
const { startServer, stopServer } = require("../helpers/fixture-server.js");
const {
  launchBrowser,
  getChannelId,
  getChannelNameFromDom,
} = require("../../src/browser/session.js");
const { createTempDirs } = require("../helpers/temp-dirs.js");

const temp = createTempDirs();

// Runs even when a test fails before its browser profile is removed.
afterEach(() => {
  temp.cleanup();
});

async function withBrowser(testFn) {
  return testFn(temp.make("browser-session-"));
}

async function gotoChannelPath(page) {
  const server = await startServer(0, [
    { path: "/channels/111/222", body: "<!DOCTYPE html><html><body>channel</body></html>" },
  ]);
  const port = server.address().port;
  await page.goto(`http://localhost:${port}/channels/111/222`);
  await stopServer(server);
}

describe("launchBrowser", () => {
  it("returns a context, page, and session", async () => {
    await withBrowser(async (profileDir) => {
      const { context, page, session } = await launchBrowser(profileDir, { headless: true });
      assert.equal(typeof context, "object");
      assert.equal(typeof page, "object");
      assert.equal(typeof session.getToken, "function");
      assert.equal(session.getToken(), null);
      await context.close();
    });
  });

  it("captures a token from a Discord-like API request", async () => {
    await withBrowser(async (profileDir) => {
      const { context, page, session } = await launchBrowser(profileDir, { headless: true });

      await page.route("**/api/**", (route) => {
        route.fulfill({ status: 200, body: JSON.stringify({}) });
      });

      await page.goto("about:blank");
      await page.evaluate(() =>
        fetch("https://discord.com/api/v9/channels/123", {
          headers: { Authorization: "Bearer test-token-123" },
        })
      );

      assert.equal(session.getToken(), "Bearer test-token-123");
      await context.close();
    });
  });
});

describe("getChannelId", () => {
  it("extracts the channel ID from a Discord channel URL", async () => {
    await withBrowser(async (profileDir) => {
      const { context, page } = await launchBrowser(profileDir, { headless: true });
      await gotoChannelPath(page);
      const id = await getChannelId(page);
      assert.equal(id, "222");
      await context.close();
    });
  });

  it("returns null when not on a channel URL", async () => {
    await withBrowser(async (profileDir) => {
      const { context, page } = await launchBrowser(profileDir, { headless: true });
      await page.goto("about:blank");
      const id = await getChannelId(page);
      assert.equal(id, null);
      await context.close();
    });
  });
});

describe("getChannelNameFromDom", () => {
  it("returns the channel name from the first DOM candidate", async () => {
    await withBrowser(async (profileDir) => {
      const { context, page } = await launchBrowser(profileDir, { headless: true });
      await page.setContent(`
        <div class="headerText_"><span>general-chat</span></div>
      `);
      const name = await getChannelNameFromDom(page);
      assert.equal(name, "general-chat");
      await context.close();
    });
  });

  it("falls back to 'unknown' when no candidate matches", async () => {
    await withBrowser(async (profileDir) => {
      const { context, page } = await launchBrowser(profileDir, { headless: true });
      await page.setContent(`<div>No channel name here</div>`);
      const name = await getChannelNameFromDom(page);
      assert.equal(name, "unknown");
      await context.close();
    });
  });

  it("falls back to aria-label when class selectors miss", async () => {
    await withBrowser(async (profileDir) => {
      const { context, page } = await launchBrowser(profileDir, { headless: true });
      await page.setContent(`
        <div>
          <button aria-label="general (channel)">Open</button>
        </div>
      `);
      const name = await getChannelNameFromDom(page);
      assert.equal(name, "general");
      await context.close();
    });
  });

  it("falls back to document.title when it contains a channel name", async () => {
    await withBrowser(async (profileDir) => {
      const { context, page } = await launchBrowser(profileDir, { headless: true });
      await page.setContent(`
        <!DOCTYPE html>
        <html>
          <head><title>#random-chat | Server</title></head>
          <body><div>No channel classes</div></body>
        </html>
      `);
      const name = await getChannelNameFromDom(page);
      assert.equal(name, "random-chat");
      await context.close();
    });
  });
});
