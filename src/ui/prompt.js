/**
 * Terminal prompt helpers for the interactive backup flow.
 */

"use strict";

const readline = require("readline");

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
      pending.reject(new Error("Prompt closed"));
    }
  });

  function prompt(question) {
    return new Promise((resolve, reject) => {
      if (closed) {
        reject(new Error("Prompt closed"));
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

module.exports = { createPrompt };
