/**
 * File downloader with bounded redirects, retry/backoff, atomic writes, and
 * cancellation for discord-channel-dump.
 */

"use strict";

const fs = require("fs");
const https = require("https");
const http = require("http");
const path = require("path");
const config = require("./config");

function isRetryableStatus(status) {
  return status >= 500 || status === 429;
}

function unlink(partPath) {
  try {
    fs.unlinkSync(partPath);
  } catch {
    /* ignore unlink errors */
  }
}

/**
 * Downloads a file from rawUrl to destPath.
 *
 * @param {string} rawUrl - URL to download.
 * @param {string} destPath - Final destination path.
 * @param {Object} [options] - Download options.
 * @param {Object} [options.cancelToken] - Cancellation token from createCancelToken().
 * @param {number} [options.maxRedirects] - Maximum number of redirects to follow (default from config).
 * @param {number} [options.maxRetries] - Maximum retries for transient errors (default from config).
 * @param {number} [options.retryDelayMs] - Base retry delay in milliseconds (default from config).
 * @param {number} [options.jitterMaxMs] - Maximum jitter added to retry delay (default from config).
 * @param {number} [options.timeoutMs] - Per-request timeout in milliseconds (default from config).
 * @returns {Promise<void>}
 */
function downloadFile(rawUrl, destPath, options = {}) {
  const {
    cancelToken,
    maxRedirects = config.maxRedirects ?? 10,
    maxRetries = config.maxRetries ?? 3,
    retryDelayMs = config.retryDelayMs ?? 1000,
    jitterMaxMs = config.jitterMaxMs ?? 500,
    timeoutMs = config.downloadTimeoutMs ?? 20000,
  } = options;

  const partPath = `${destPath}.part`;

  return new Promise((resolve, reject) => {
    if (cancelToken) cancelToken.throwIfCancelled();

    let settled = false;
    let activeReq = null;
    let activeFile = null;
    let redirectCount = 0;
    let retryAttempt = 0;
    let currentUrl = rawUrl;

    function cleanup() {
      try {
        activeReq?.destroy();
      } catch {
        /* ignore */
      }
      try {
        activeFile?.destroy();
      } catch {
        /* ignore */
      }
    }

    function settle(err) {
      if (settled) return;
      settled = true;
      cleanup();
      if (err) {
        unlink(partPath);
        reject(err);
      } else {
        fs.rename(partPath, destPath, (renameErr) => {
          if (renameErr) {
            unlink(partPath);
            reject(renameErr);
          } else {
            resolve();
          }
        });
      }
    }

    if (cancelToken) {
      cancelToken.onCancel(() => {
        settle(new Error("Download cancelled"));
      });
    }

    function retryDelay() {
      const jitter = Math.floor(Math.random() * (jitterMaxMs + 1));
      return retryDelayMs * Math.pow(2, retryAttempt - 1) + jitter;
    }

    function attemptGet(url) {
      if (settled) return;

      let parsed;
      try {
        parsed = new URL(url);
      } catch (e) {
        settle(e);
        return;
      }

      if (cancelToken) cancelToken.throwIfCancelled();

      try {
        fs.mkdirSync(path.dirname(partPath), { recursive: true });
      } catch {
        /* ignore mkdir errors; the write stream will surface real problems */
      }

      const client = parsed.protocol === "https:" ? https : http;

      activeReq = client.get(url, { headers: { "User-Agent": "Mozilla/5.0" } }, (res) => {
        if (settled) {
          res.resume();
          return;
        }

        if (res.statusCode >= 300 && res.statusCode < 400) {
          res.resume();
          const location = res.headers.location;
          if (!location) {
            settle(new Error(`Redirect without Location — ${url}`));
            return;
          }
          if (redirectCount >= maxRedirects) {
            settle(new Error(`Too many redirects — ${url}`));
            return;
          }
          redirectCount++;
          currentUrl = new URL(location, url).toString();
          attemptGet(currentUrl);
          return;
        }

        if (res.statusCode !== 200) {
          res.resume();
          if (isRetryableStatus(res.statusCode) && retryAttempt < maxRetries) {
            retryAttempt++;
            setTimeout(() => attemptGet(currentUrl), retryDelay());
            return;
          }
          settle(new Error(`HTTP ${res.statusCode} — ${url}`));
          return;
        }

        activeFile = fs.createWriteStream(partPath);
        activeFile.on("error", (e) => settle(e));
        res.pipe(activeFile);
        activeFile.on("finish", () => settle(null));
        res.on("error", (e) => settle(e));
      });

      activeReq.on("error", (e) => {
        if (settled) return;
        if (retryAttempt < maxRetries) {
          retryAttempt++;
          setTimeout(() => attemptGet(currentUrl), retryDelay());
        } else {
          settle(e);
        }
      });

      activeReq.setTimeout(timeoutMs, () => {
        activeReq.destroy(new Error(`Timeout (>${timeoutMs / 1000}s) — ${url}`));
      });
    }

    attemptGet(currentUrl);
  });
}

module.exports = {
  downloadFile,
};
