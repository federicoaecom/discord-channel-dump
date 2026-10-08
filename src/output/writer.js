/**
 * Channel output writing: directory creation, media download orchestration,
 * and persistence of messages.json + index.html.
 */

"use strict";

const fs = require("fs");
const path = require("path");
const { sanitize } = require("../utils/sanitize");
const { mediaFilenameFromUrl } = require("../utils/filenames");
const { ensureDir } = require("../utils/fs");
const { generateHtml } = require("../viewer/render");
const { downloadFile } = require("../downloader");
const { isCancelError } = require("../cancel-token");
const { green, yellow, dim } = require("../ui/colors");
const logger = require("../ui/logger");
const { t, getLanguage } = require("../i18n");
const { renderProgressBar } = require("../ui/progress");

const WINDOWS_RESERVED_NAME = /^(con|prn|aux|nul|com[1-9]|lpt[1-9])$/i;

function handleDownloadError(e) {
  if (isCancelError(e)) {
    throw e;
  }
}

function planMediaFilenames(urls) {
  const filenames = new Map();
  for (const url of new Set(urls)) {
    filenames.set(url, mediaFilenameFromUrl(url));
  }
  return filenames;
}

async function downloadMediaType(messages, directory, type, cancelToken, downloadFileFn) {
  for (const message of messages) message[type.localKey] = [];

  const urls = messages.flatMap((message) =>
    (message[type.sourceKey] || []).map((item) => type.getUrl(item))
  );
  const filenames = planMediaFilenames(urls);
  if (filenames.size === 0) return;

  const outcomes = new Map();
  let processed = 0;
  let downloaded = 0;
  let reused = 0;
  let failed = 0;
  const startedAt = Date.now();

  for (const message of messages) {
    for (const item of message[type.sourceKey] || []) {
      const url = type.getUrl(item);
      if (!outcomes.has(url)) {
        const filename = filenames.get(url);
        const destPath = path.join(directory, filename);
        let success = false;

        if (fs.existsSync(destPath)) {
          reused++;
          success = true;
        } else {
          try {
            await downloadFileFn(url, destPath, { cancelToken });
            downloaded++;
            success = true;
          } catch (error) {
            handleDownloadError(error);
            failed++;
            logger.write(`\n  ${yellow(t(type.skipTagKey))} ${error.message}\n`);
          }
        }

        outcomes.set(url, { filename, success });
        processed++;
        const elapsed = ((Date.now() - startedAt) / 1000).toFixed(0);
        const bar = renderProgressBar(Math.round((processed / filenames.size) * 100), {
          label: t(type.labelKey),
        });
        const counts = t("writer.progress", {
          processed,
          total: filenames.size,
          downloaded,
          reused,
          failed,
          elapsed,
        });
        logger.write(`\r  ${bar} ${counts}`);
      }

      const outcome = outcomes.get(url);
      if (outcome.success) {
        message[type.localKey].push(type.toLocal(item, outcome.filename));
      }
    }
  }

  logger.info(
    `\n  ${green(t(type.doneKey))} ${t("writer.mediaSummary", { downloaded, reused, failed })}`
  );
}

function resolveChannelDir(backupDir, channelName) {
  const sanitizedName = sanitize(channelName);
  if (sanitizedName === "" || sanitizedName === "." || sanitizedName === "..") {
    throw new Error(t("writer.invalidName.empty", { name: sanitizedName }));
  }

  const portableName = sanitizedName.replace(/[ .]+$/g, "");
  const deviceName = portableName.split(".", 1)[0].replace(/ +$/g, "");
  if (WINDOWS_RESERVED_NAME.test(deviceName)) {
    throw new Error(t("writer.invalidName.reserved", { name: sanitizedName }));
  }

  const baseDir = path.resolve(backupDir);
  const channelDir = path.resolve(baseDir, sanitizedName);
  const relative = path.relative(baseDir, channelDir);
  const escapesBase = relative === ".." || relative.startsWith(`..${path.sep}`);
  if (relative === "" || escapesBase || path.isAbsolute(relative)) {
    throw new Error(t("writer.invalidName.outsideBackupDir", { name: sanitizedName }));
  }

  return channelDir;
}

/**
 * Download images and attachments for a set of messages.
 * @param {Array<Object>} messages - Normalized messages with images and attachments.
 * @param {string} imagesDir - Destination directory for images.
 * @param {string} attachmentsDir - Destination directory for attachments.
 * @param {Object|null} [cancelToken] - Optional cancellation token.
 * @param {Function} [downloadFileFn] - Optional download implementation (default: downloadFile).
 * @returns {Promise<void>}
 */
async function downloadMedia(
  messages,
  imagesDir,
  attachmentsDir,
  cancelToken = null,
  downloadFileFn = downloadFile
) {
  await downloadMediaType(
    messages,
    imagesDir,
    {
      labelKey: "writer.images.label",
      skipTagKey: "writer.images.skipTag",
      doneKey: "writer.images.done",
      sourceKey: "images",
      localKey: "localImages",
      getUrl: (url) => url,
      toLocal: (_url, filename) => path.posix.join("images", filename),
    },
    cancelToken,
    downloadFileFn
  );

  await downloadMediaType(
    messages,
    attachmentsDir,
    {
      labelKey: "writer.attachments.label",
      skipTagKey: "writer.attachments.skipTag",
      doneKey: "writer.attachments.done",
      sourceKey: "attachments",
      localKey: "localAttachments",
      getUrl: (attachment) => attachment.url,
      toLocal: (attachment, filename) => ({
        label: attachment.label,
        path: path.posix.join("attachments", filename),
      }),
    },
    cancelToken,
    downloadFileFn
  );
}

/**
 * Persist a channel backup as messages.json and index.html.
 * @param {string} channelName - Raw channel name.
 * @param {Array<Object>} messages - Normalized messages to save.
 * @param {Object} config - Configuration object with backupDir.
 * @param {Object|null} [cancelToken] - Optional cancellation token.
 * @param {Function} [downloadMediaFn] - Optional download implementation (default: downloadMedia).
 * @returns {Promise<{ channelDir: string, messageCount: number, imageCount: number, attachmentCount: number }>}
 */
async function saveChannel(
  channelName,
  messages,
  config,
  cancelToken = null,
  downloadMediaFn = downloadMedia
) {
  const channelDir = resolveChannelDir(config.backupDir, channelName);
  const imagesDir = path.join(channelDir, "images");
  const attachmentsDir = path.join(channelDir, "attachments");
  ensureDir(channelDir);
  ensureDir(imagesDir);
  ensureDir(attachmentsDir);
  logger.info(`  ${t("writer.folder", { path: channelDir })}\n`);

  await downloadMediaFn(messages, imagesDir, attachmentsDir, cancelToken);

  fs.writeFileSync(
    path.join(channelDir, "messages.json"),
    JSON.stringify(messages, null, 2),
    "utf8"
  );
  fs.writeFileSync(
    path.join(channelDir, "index.html"),
    generateHtml(channelName, messages, { lang: getLanguage() }),
    "utf8"
  );

  const imgs = messages.reduce((n, m) => n + (m.localImages || []).length, 0);
  const atts = messages.reduce((n, m) => n + (m.localAttachments || []).length, 0);

  const mediaCounts = t("writer.mediaCounts", { images: imgs, attachments: atts });
  logger.info(
    `\n  ${green(t("writer.saved"))} ${messages.length} ${dim(t("writer.messages"))} | ${mediaCounts}`
  );
  logger.info(`  ${t("writer.output", { path: channelDir })}\n`);
  logger.info(dim("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"));

  return {
    channelDir,
    messageCount: messages.length,
    imageCount: imgs,
    attachmentCount: atts,
  };
}

module.exports = {
  downloadMedia,
  saveChannel,
};
