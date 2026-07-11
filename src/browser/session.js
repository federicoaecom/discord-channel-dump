/**
 * Browser launch, session persistence, token capture, and DOM-based helpers.
 */

"use strict";

const { chromium } = require("playwright");
const { ensureDir } = require("../utils/fs");

const DEFAULT_USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36";

/**
 * Capture the Discord authorization token from outgoing API requests.
 * @param {Object} page - Playwright page instance.
 * @returns {{ getToken: () => string | null }} Object with a getToken accessor.
 */
function startTokenCapture(page) {
  let token = null;
  page.on("request", (req) => {
    if (!token && req.url().includes("discord.com/api")) {
      const auth = req.headers()["authorization"];
      if (auth && auth.length > 10) token = auth;
    }
  });
  return { getToken: () => token };
}

/**
 * Launch a persistent Chromium browser context.
 * @param {string} profileDir - Directory to store the persistent browser profile.
 * @param {Object} [options] - Extra Playwright context options.
 * @returns {Promise<{ context: Object, page: Object, session: { getToken: () => string | null } }>}
 */
async function launchBrowser(profileDir, options = {}) {
  ensureDir(profileDir);

  const context = await chromium.launchPersistentContext(profileDir, {
    headless: false,
    args: ["--start-maximized"],
    viewport: null,
    userAgent: DEFAULT_USER_AGENT,
    baseURL: "https://discord.com",
    ...options,
  });

  const page = context.pages()[0] ?? (await context.newPage());
  const session = startTokenCapture(page);

  return { context, page, session };
}

/**
 * Read the current Discord channel ID from the page URL.
 * @param {Object} page - Playwright page instance.
 * @returns {Promise<string|null>} Channel ID or null if not detected.
 */
async function getChannelId(page) {
  return page.evaluate(() => {
    try {
      const m = location.pathname.match(/\/channels\/\d+\/(\d+)/);
      return m ? m[1] : null;
    } catch {
      return null;
    }
  });
}

/**
 * Try to detect the visible channel name from Discord's DOM.
 * @param {Object} page - Playwright page instance.
 * @returns {Promise<string>} Channel name or "unknown" if not detected.
 */
async function getChannelNameFromDom(page) {
  return page.evaluate(() => {
    const selectors = [
      "h2[class*='title_'] span",
      "[class*='headerText_'] span",
      "[class*='channelName']",
    ];
    for (const selector of selectors) {
      const el = document.querySelector(selector);
      const t = el && el.textContent.trim();
      if (t) return t;
    }

    // Fallback: Discord labels the channel header with aria-label like "#general" or "general (channel)".
    for (const el of document.querySelectorAll("[aria-label]")) {
      const label = el.getAttribute("aria-label").trim();
      const match = label.match(/^#?([\w-]+)(?:\s+\(channel\))?$/i);
      if (match && match[1]) return match[1];
    }

    // Fallback: page title may contain the channel name, e.g. "#general | Server Name".
    const titleMatch = document.title && document.title.match(/#([\w-]+)/);
    if (titleMatch && titleMatch[1]) return titleMatch[1];

    return "unknown";
  });
}

module.exports = {
  launchBrowser,
  getChannelId,
  getChannelNameFromDom,
};
