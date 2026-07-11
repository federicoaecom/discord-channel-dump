/**
 * Discord REST API calls made from the Node process context.
 */

"use strict";

const logger = require("../ui/logger");

/**
 * Wait for the specified number of milliseconds.
 * @param {number} ms - Milliseconds to sleep.
 * @returns {Promise<void>}
 */
function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

/**
 * Fetch a channel's name from the Discord API.
 * @param {Object} request - Playwright API request context.
 * @param {string} token - Discord authorization token.
 * @param {string} channelId - Discord channel ID.
 * @returns {Promise<string|null>} The channel name, or null if not available.
 */
async function getChannelName(request, token, channelId) {
  const res = await request.get(`/api/v9/channels/${channelId}`, {
    headers: {
      Authorization: token,
      "Content-Type": "application/json",
    },
  });
  if (res.ok) {
    const data = await res.json();
    return data.name || null;
  }
  return null;
}

/**
 * Fetch all messages in a channel by paginating backwards through the Discord API.
 * @param {Object} request - Playwright API request context.
 * @param {string} token - Discord authorization token.
 * @param {string} channelId - Discord channel ID.
 * @param {Object} config - Configuration object with apiBatchSize and apiDelayMs.
 * @returns {Promise<Array<Object>>} Sorted array of raw message objects.
 */
async function fetchAllMessages(request, token, channelId, config) {
  const all = [];
  let before = null;
  let page_n = 1;

  while (true) {
    const url = before
      ? `/api/v9/channels/${channelId}/messages?limit=${config.apiBatchSize}&before=${before}`
      : `/api/v9/channels/${channelId}/messages?limit=${config.apiBatchSize}`;

    let batch;
    while (true) {
      const res = await request.get(url, {
        headers: {
          Authorization: token,
          "Content-Type": "application/json",
        },
      });

      if (res.status === 429) {
        const body = await res.json().catch(() => ({}));
        const wait = Math.ceil((body.retry_after ?? 5) * 1000) + 200;
        logger.write(`\n  [rate limit] waiting ${(wait / 1000).toFixed(1)}s…`);
        await sleep(wait);
        continue;
      }

      if (!res.ok) {
        const text = await res.text().catch(() => "");
        throw new Error(`API ${res.status}: ${text}`);
      }

      batch = await res.json();
      break;
    }

    if (!Array.isArray(batch) || batch.length === 0) {
      break;
    }

    all.push(...batch);
    before = batch[batch.length - 1].id;

    logger.write(`\r  Page ${page_n}: ${all.length} messages fetched...   `);
    page_n++;

    if (batch.length < config.apiBatchSize) {
      break;
    }

    await sleep(config.apiDelayMs);
  }

  all.sort((a, b) => (a.id > b.id ? 1 : -1));
  return all;
}

module.exports = {
  getChannelName,
  fetchAllMessages,
};
