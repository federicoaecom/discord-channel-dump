/**
 * Interactive backup orchestration.
 *
 * This module wires browser session, Discord API, message normalization,
 * and output writing into the user-facing capture loop.
 */

"use strict";

const fs = require("fs");
const path = require("path");
const { ensureDir } = require("./utils/fs");
const { createPrompt } = require("./ui/prompt");
const { cyan, yellow, dim } = require("./ui/colors");
const logger = require("./ui/logger");
const { launchBrowser, getChannelId, getChannelNameFromDom } = require("./browser/session");
const { getChannelName, fetchAllMessages } = require("./api/discord");
const { normalizeMessage } = require("./messages/normalize");
const { saveChannel } = require("./output/writer");

let currentContext = null;
let shutdownRegistered = false;

/**
 * Remove leftover `.part` files from a directory tree during shutdown.
 * @param {string} dir - Directory to clean.
 */
function cleanupPartFiles(dir) {
  try {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        cleanupPartFiles(full);
      } else if (entry.name.endsWith(".part")) {
        try {
          fs.rmSync(full, { force: true, maxRetries: 10, retryDelay: 100 });
        } catch {
          /* ignore cleanup errors during shutdown */
        }
      }
    }
  } catch {
    /* ignore filesystem errors during emergency cleanup */
  }
}

/**
 * Cancel in-flight work and clean up resources on shutdown signals.
 * @param {string} signal - Signal name (e.g. "SIGINT").
 * @param {Object} cancelToken - Cancellation token from createCancelToken().
 * @param {string} backupDir - Backup directory for `.part` cleanup.
 * @returns {Promise<void>}
 */
async function shutdown(signal, cancelToken, backupDir) {
  logger.write(`\n  [${signal}] Cancelling and cleaning up…\n`);
  if (cancelToken) cancelToken.cancel();
  cleanupPartFiles(backupDir);
  try {
    if (currentContext) await currentContext.close();
  } catch {
    /* ignore close errors during shutdown */
  }
}

/**
 * Register SIGINT/SIGTERM handlers for graceful shutdown.
 * @param {Object} cancelToken - Cancellation token from createCancelToken().
 * @param {Object} config - Configuration object with backupDir.
 * @param {Function} [closePrompt] - Optional callback to close the interactive prompt.
 */
function registerShutdown(cancelToken, config, closePrompt) {
  if (shutdownRegistered) return;
  shutdownRegistered = true;
  process.on("SIGINT", async () => {
    await shutdown("SIGINT", cancelToken, config.backupDir);
    process.exitCode = 1;
    if (closePrompt) closePrompt();
  });
  process.on("SIGTERM", async () => {
    await shutdown("SIGTERM", cancelToken, config.backupDir);
    process.exitCode = 1;
    if (closePrompt) closePrompt();
  });
}

const DEFAULT_DEPS = {
  createPrompt,
  launchBrowser,
  getChannelId,
  getChannelNameFromDom,
  getChannelName,
  fetchAllMessages,
  normalizeMessage,
  saveChannel,
  logger,
};

/**
 * Run the interactive browser backup session.
 * @param {Object} config - Resolved configuration object.
 * @param {Object} cancelToken - Cancellation token from createCancelToken().
 * @param {Object} [deps] - Optional dependency injection object for testing.
 * @returns {Promise<void>}
 */
async function runBrowserSession(config, cancelToken, deps = DEFAULT_DEPS) {
  const {
    createPrompt,
    launchBrowser,
    getChannelId,
    getChannelNameFromDom,
    getChannelName,
    fetchAllMessages,
    normalizeMessage,
    saveChannel,
    logger: depsLogger,
  } = { ...DEFAULT_DEPS, ...deps };

  ensureDir(config.backupDir);
  ensureDir(config.profileDir);

  depsLogger.info(cyan("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"));
  depsLogger.info(cyan("  Discord Channel Dump  v3 (API mode)"));
  depsLogger.info(cyan("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"));
  depsLogger.info(`  ${dim("Profile:")} ${config.profileDir}`);

  const { context, page, session } = await launchBrowser(config.profileDir);
  currentContext = context;

  await page.goto("https://discord.com/app", { waitUntil: "domcontentloaded" });

  depsLogger.info("\n  Log in to Discord if prompted.");
  depsLogger.info("  Then navigate to any channel and press ENTER.\n");

  const { prompt, close } = createPrompt();
  registerShutdown(cancelToken, config, close);

  try {
    while (true) {
      const cmd = await prompt('  > ENTER to capture | "exit" to quit: ');
      if (cmd.toLowerCase() === "exit") break;

      const token = session.getToken();
      const channelId = await getChannelId(page);

      if (!token) {
        depsLogger.info(
          yellow(
            "\n  Token not captured yet — make sure Discord is open and loaded, then try again.\n"
          )
        );
        continue;
      }
      if (!channelId) {
        depsLogger.info(yellow("\n  Could not detect channel ID. Navigate to a channel first.\n"));
        continue;
      }

      depsLogger.info(`\n  Channel ID: ${channelId}`);
      const detected = await getChannelName(context.request, token, channelId);
      const fallback = await getChannelNameFromDom(page);
      const channelName = detected || fallback;
      depsLogger.info(`  Channel name: "${channelName}"`);
      const override = await prompt("  > Confirm (ENTER) or type a custom name: ");
      const finalName = override || channelName;

      const raw = await fetchAllMessages(context.request, token, channelId, config);

      if (config.dryRun) {
        depsLogger.info(yellow(`  Dry run: would back up ${raw.length} messages.`));
        continue;
      }

      const messages = raw.map(normalizeMessage);
      await saveChannel(finalName, messages, config, cancelToken);
    }
  } catch (err) {
    if (err.message !== "Prompt closed") throw err;
  } finally {
    close();
    await context.close();
    currentContext = null;
    depsLogger.info("  Done.");
  }
}

module.exports = {
  runBrowserSession,
  registerShutdown,
  shutdown,
};
