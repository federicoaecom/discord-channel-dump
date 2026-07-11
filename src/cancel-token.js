/**
 * Simple cancellation token used by the downloader and backup flow.
 */

"use strict";

/**
 * Create a cancellation token that callbacks can subscribe to and check.
 * @returns {{
 *   cancel: () => void,
 *   onCancel: (cb: () => void) => void,
 *   isCancelled: () => boolean,
 *   throwIfCancelled: () => void
 * }} The cancellation token object.
 */
function createCancelToken() {
  let cancelled = false;
  const callbacks = [];

  function cancel() {
    if (cancelled) return;
    cancelled = true;
    for (const cb of callbacks) {
      try {
        cb();
      } catch {
        /* ignore callback errors */
      }
    }
  }

  function onCancel(cb) {
    if (typeof cb !== "function") return;
    if (cancelled) {
      try {
        cb();
      } catch {
        /* ignore callback errors */
      }
    } else {
      callbacks.push(cb);
    }
  }

  function isCancelled() {
    return cancelled;
  }

  function throwIfCancelled() {
    if (cancelled) {
      const err = new Error("Cancelled");
      err.name = "CancelError";
      throw err;
    }
  }

  return { cancel, onCancel, isCancelled, throwIfCancelled };
}

module.exports = { createCancelToken };
