/**
 * Channel output writing: directory creation, media download orchestration,
 * and persistence of messages.json + index.html.
 */

"use strict";

const fs = require("fs");
const path = require("path");
const { sanitize } = require("../utils/sanitize");
const { filenameFromUrl, uniqueFilename } = require("../utils/filenames");
const { ensureDir } = require("../utils/fs");
const { generateHtml } = require("../viewer/render");
const { downloadFile } = require("../downloader");
const { green, yellow, dim } = require("../ui/colors");
const logger = require("../ui/logger");
const { renderProgressBar } = require("../ui/progress");

const WINDOWS_RESERVED_NAME = /^(con|prn|aux|nul|com[1-9]|lpt[1-9])$/i;

function handleDownloadError(e) {
  if (e.name === "CancelError" || /cancelled/i.test(e.message)) {
    throw e;
  }
}

function resolveChannelDir(backupDir, channelName) {
  const sanitizedName = sanitize(channelName);
  if (sanitizedName === "" || sanitizedName === "." || sanitizedName === "..") {
    throw new Error(
      `Invalid channel name "${sanitizedName}": expected a non-empty channel subdirectory`
    );
  }

  const portableName = sanitizedName.replace(/[ .]+$/g, "");
  const deviceName = portableName.split(".", 1)[0].replace(/ +$/g, "");
  if (WINDOWS_RESERVED_NAME.test(deviceName)) {
    throw new Error(`Invalid channel name "${sanitizedName}": reserved on Windows`);
  }

  const baseDir = path.resolve(backupDir);
  const channelDir = path.resolve(baseDir, sanitizedName);
  const relative = path.relative(baseDir, channelDir);
  const escapesBase = relative === ".." || relative.startsWith(`..${path.sep}`);
  if (relative === "" || escapesBase || path.isAbsolute(relative)) {
    throw new Error(
      `Invalid channel name "${sanitizedName}": resolved directory must be inside backupDir`
    );
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
  // Images
  const totalImages = messages.reduce((n, m) => n + (m.images || []).length, 0);
  if (totalImages > 0) {
    let done = 0,
      skipped = 0,
      i = 0;
    const t0 = Date.now();
    for (const msg of messages) {
      msg.localImages = [];
      for (const imgUrl of msg.images || []) {
        i++;
        const fname = uniqueFilename(imagesDir, filenameFromUrl(imgUrl));
        const destPath = path.join(imagesDir, fname);
        const elapsed = ((Date.now() - t0) / 1000).toFixed(0);
        logger.write(
          `\r  ${renderProgressBar(Math.round((i / totalImages) * 100), {
            label: "Images",
          })} ${done}/${totalImages} OK ${skipped} skipped ${elapsed}s`
        );
        if (!fs.existsSync(destPath)) {
          try {
            await downloadFileFn(imgUrl, destPath, { cancelToken });
            done++;
          } catch (e) {
            handleDownloadError(e);
            skipped++;
            logger.write(`\n  ${yellow("[skip img]")} ${e.message}\n`);
          }
        } else {
          done++;
        }
        msg.localImages.push(path.posix.join("images", fname));
      }
    }
    logger.info(`\n  ${green("Images done:")} ${done} saved, ${skipped} failed.`);
  } else {
    messages.forEach((m) => {
      m.localImages = [];
    });
  }

  // Attachments
  const totalAtts = messages.reduce((n, m) => n + (m.attachments || []).length, 0);
  if (totalAtts > 0) {
    let done = 0,
      skipped = 0,
      i = 0;
    const t0 = Date.now();
    for (const msg of messages) {
      msg.localAttachments = [];
      for (const att of msg.attachments || []) {
        i++;
        const fname = uniqueFilename(attachmentsDir, filenameFromUrl(att.url));
        const destPath = path.join(attachmentsDir, fname);
        const elapsed = ((Date.now() - t0) / 1000).toFixed(0);
        logger.write(
          `\r  ${renderProgressBar(Math.round((i / totalAtts) * 100), {
            label: "Attachments",
          })} ${done}/${totalAtts} OK ${skipped} skipped ${elapsed}s`
        );
        if (!fs.existsSync(destPath)) {
          try {
            await downloadFileFn(att.url, destPath, { cancelToken });
            done++;
          } catch (e) {
            handleDownloadError(e);
            skipped++;
            logger.write(`\n  ${yellow("[skip att]")} ${e.message}\n`);
          }
        } else {
          done++;
        }
        msg.localAttachments.push({
          label: att.label,
          path: path.posix.join("attachments", fname),
        });
      }
    }
    logger.info(`\n  ${green("Attachments done:")} ${done} saved, ${skipped} failed.`);
  } else {
    messages.forEach((m) => {
      m.localAttachments = [];
    });
  }
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
  logger.info(`  Folder: ${channelDir}\n`);

  await downloadMediaFn(messages, imagesDir, attachmentsDir, cancelToken);

  fs.writeFileSync(
    path.join(channelDir, "messages.json"),
    JSON.stringify(messages, null, 2),
    "utf8"
  );
  fs.writeFileSync(
    path.join(channelDir, "index.html"),
    generateHtml(channelName, messages),
    "utf8"
  );

  const imgs = messages.reduce((n, m) => n + (m.localImages || []).length, 0);
  const atts = messages.reduce((n, m) => n + (m.localAttachments || []).length, 0);

  logger.info(
    `\n  ${green("Saved")} ${messages.length} ${dim("messages")} | Images: ${imgs} | Attachments: ${atts}`
  );
  logger.info(`  Output: ${channelDir}\n`);
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
