/**
 * Terminal prompt helpers for the interactive backup flow.
 */

"use strict";

const readline = require("readline");

const PROMPT_CLOSED = "PROMPT_CLOSED";

function createPromptClosedError() {
  const err = new Error("Prompt closed");
  err.code = PROMPT_CLOSED;
  return err;
}

/**
 * Check whether an error signals that the prompt input was closed.
 * @param {unknown} err - Value to check.
 * @returns {boolean} True when the error carries the PROMPT_CLOSED code.
 */
function isPromptClosedError(err) {
  return Boolean(err) && err.code === PROMPT_CLOSED;
}

/**
 * Create a reusable terminal prompt.
 * @param {NodeJS.ReadableStream} [input] - Input stream (default: process.stdin).
 * @param {NodeJS.WritableStream} [output] - Output stream (default: process.stdout).
 * @returns {{ prompt: (question: string) => Promise<string>, close: () => void }}
 *   Prompt object with async question and close methods.
 */
function createPrompt(input = process.stdin, output = process.stdout) {
  const rl = readline.createInterface({ input, output, terminal: false });
  const queue = [];
  let closed = false;

  rl.on("line", (line) => {
    const pending = queue.shift();
    if (pending) pending.resolve(line.trim());
  });

  rl.on("close", () => {
    closed = true;
    while (queue.length > 0) {
      const pending = queue.shift();
      pending.reject(createPromptClosedError());
    }
  });

  function prompt(question) {
    return new Promise((resolve, reject) => {
      if (closed) {
        reject(createPromptClosedError());
        return;
      }
      queue.push({ resolve, reject });
      output.write(question);
    });
  }

  function close() {
    rl.close();
  }

  return { prompt, close };
}

module.exports = { createPrompt, isPromptClosedError, PROMPT_CLOSED };
