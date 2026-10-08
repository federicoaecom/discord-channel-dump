/**
 * Interactive backup orchestration.
 *
 * This module wires browser session, Discord API, message normalization,
 * and output writing into the user-facing capture loop.
 */

"use strict";

const fs = require("fs");
const path = require("path");
const pkg = require("../package.json");
const { ensureDir } = require("./utils/fs");
const { createPrompt, isPromptClosedError } = require("./ui/prompt");
const { cyan, yellow, dim } = require("./ui/colors");
const logger = require("./ui/logger");
const { t } = require("./i18n");
const { launchBrowser, getChannelId, getChannelNameFromDom } = require("./browser/session");
const { getChannelName, fetchAllMessages } = require("./api/discord");
const { normalizeMessage } = require("./messages/normalize");
const { saveChannel } = require("./output/writer");

// Accepted in every interface language so the quit word never depends on --lang.
const EXIT_COMMANDS = new Set(["exit", "salir"]);

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
  logger.write(`\n  [${signal}] ${t("app.shutdown")}\n`);
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
  depsLogger.info(cyan(`  ${t("app.banner", { version: pkg.version })}`));
  depsLogger.info(cyan("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"));
  depsLogger.info(`  ${dim(t("app.profileLabel"))} ${config.profileDir}`);

  const { context, page, session } = await launchBrowser(config.profileDir);
  currentContext = context;

  await page.goto("https://discord.com/app", { waitUntil: "domcontentloaded" });

  depsLogger.info(`\n  ${t("app.loginHint")}`);
  depsLogger.info(`  ${t("app.navigateHint")}\n`);

  const { prompt, close } = createPrompt();
  registerShutdown(cancelToken, config, close);

  try {
    while (true) {
      const cmd = await prompt(`  > ${t("app.prompt.capture")}`);
      if (EXIT_COMMANDS.has(cmd.trim().toLowerCase())) break;

      const token = session.getToken();
      const channelId = await getChannelId(page);

      if (!token) {
        depsLogger.info(yellow(`\n  ${t("app.tokenMissing")}\n`));
        continue;
      }
      if (!channelId) {
        depsLogger.info(yellow(`\n  ${t("app.channelIdMissing")}\n`));
        continue;
      }

      depsLogger.info(`\n  ${t("app.channelId", { id: channelId })}`);
      const detected = await getChannelName(context.request, token, channelId);
      const fallback = await getChannelNameFromDom(page);
      const channelName = detected || fallback;
      depsLogger.info(`  ${t("app.channelName", { name: channelName })}`);
      const override = await prompt(`  > ${t("app.prompt.confirmName")}`);
      const finalName = override || channelName;

      const raw = await fetchAllMessages(context.request, token, channelId, config);

      if (config.dryRun) {
        depsLogger.info(yellow(`  ${t("app.dryRunSummary", { count: raw.length })}`));
        continue;
      }

      const messages = raw.map(normalizeMessage);
      await saveChannel(finalName, messages, config, cancelToken);
    }
  } catch (err) {
    if (!isPromptClosedError(err)) throw err;
  } finally {
    close();
    await context.close();
    currentContext = null;
    depsLogger.info(`  ${t("app.done")}`);
  }
}

module.exports = {
  runBrowserSession,
  registerShutdown,
  shutdown,
};
