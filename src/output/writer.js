/**
 * Channel output writing: directory creation, media download orchestration,
 * and persistence of messages.json + index.html.
 */

"use strict";

const { createHash } = require("crypto");
const fs = require("fs");
const path = require("path");
const { sanitize } = require("../utils/sanitize");
const { filenameFromUrl } = require("../utils/filenames");
const { ensureDir } = require("../utils/fs");
const { generateHtml } = require("../viewer/render");
const { downloadFile } = require("../downloader");
const { green, yellow, dim } = require("../ui/colors");
const logger = require("../ui/logger");
const { renderProgressBar } = require("../ui/progress");

const MAX_MEDIA_FILENAME_BYTES = 255;
const WINDOWS_RESERVED_NAME = /^(con|prn|aux|nul|com[1-9]|lpt[1-9])$/i;

function handleDownloadError(e) {
  if (e.name === "CancelError" || /cancelled/i.test(e.message)) {
    throw e;
  }
}

function truncateUtf8(value, maxBytes) {
  let result = "";
  let byteLength = 0;

  for (const codePoint of value) {
    const codePointBytes = Buffer.byteLength(codePoint, "utf8");
    if (byteLength + codePointBytes > maxBytes) break;
    result += codePoint;
    byteLength += codePointBytes;
  }

  return result;
}

function appendSourceHash(filename, source) {
  const ext = path.extname(filename);
  const base = path.basename(filename, ext);
  const hash = createHash("sha256").update(source).digest("hex");
  const hashSuffix = `_${hash}`;
  const preservedExt =
    Buffer.byteLength(hashSuffix + ext, "utf8") <= MAX_MEDIA_FILENAME_BYTES ? ext : "";
  const maxBaseBytes =
    MAX_MEDIA_FILENAME_BYTES - Buffer.byteLength(hashSuffix + preservedExt, "utf8");
  return `${truncateUtf8(base, maxBaseBytes)}${hashSuffix}${preservedExt}`;
}

function planMediaFilenames(urls) {
  const uniqueUrls = [...new Set(urls)].sort();
  return new Map(uniqueUrls.map((url) => [url, appendSourceHash(filenameFromUrl(url), url)]));
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
            logger.write(`\n  ${yellow(`[skip ${type.shortLabel}]`)} ${error.message}\n`);
          }
        }

        outcomes.set(url, { filename, success });
        processed++;
        const elapsed = ((Date.now() - startedAt) / 1000).toFixed(0);
        logger.write(
          `\r  ${renderProgressBar(Math.round((processed / filenames.size) * 100), {
            label: type.label,
          })} ${processed}/${filenames.size} unique | ${downloaded} downloaded ${reused} reused ${failed} failed ${elapsed}s`
        );
      }

      const outcome = outcomes.get(url);
      if (outcome.success) {
        message[type.localKey].push(type.toLocal(item, outcome.filename));
      }
    }
  }

  logger.info(
    `\n  ${green(`${type.label} done:`)} ${downloaded} downloaded, ${reused} reused, ${failed} failed.`
  );
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
  await downloadMediaType(
    messages,
    imagesDir,
    {
      label: "Images",
      shortLabel: "img",
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
      label: "Attachments",
      shortLabel: "att",
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
