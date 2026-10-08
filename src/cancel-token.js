/**
 * Simple cancellation token used by the downloader and backup flow.
 */

"use strict";

const CANCEL_ERROR_NAME = "CancelError";

/**
 * Create an error that signals cancellation. Callers detect it with
 * isCancelError(), never by matching the message text.
 * @param {string} [message] - Human-readable message (default: "Cancelled").
 * @returns {Error} Error whose name identifies it as a cancellation.
 */
function createCancelError(message = "Cancelled") {
  const err = new Error(message);
  err.name = CANCEL_ERROR_NAME;
  return err;
}

/**
 * Check whether an error signals cancellation.
 * @param {unknown} err - Value to check.
 * @returns {boolean} True when the error was created by createCancelError().
 */
function isCancelError(err) {
  return Boolean(err) && err.name === CANCEL_ERROR_NAME;
}

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
    if (cancelled) throw createCancelError();
  }

  return { cancel, onCancel, isCancelled, throwIfCancelled };
}

module.exports = { createCancelToken, createCancelError, isCancelError };
