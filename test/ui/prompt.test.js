const { describe, it } = require("node:test");
const assert = require("node:assert/strict");
const { Readable, Writable } = require("node:stream");
const { createPrompt, isPromptClosedError, PROMPT_CLOSED } = require("../../src/ui/prompt.js");

function silentOutput() {
  return new Writable({
    write(_chunk, _encoding, callback) {
      callback();
    },
  });
}

describe("createPrompt", () => {
  it("asks a question and returns the trimmed line", async () => {
    const input = new Readable({
      read() {
        this.push("hello\n");
        this.push(null);
      },
    });
    const outputChunks = [];
    const output = new Writable({
      write(chunk, _encoding, callback) {
        outputChunks.push(chunk.toString());
        callback();
      },
    });

    const { prompt, close } = createPrompt(input, output);
    const answer = await prompt("What? ");
    close();

    assert.equal(answer, "hello");
    assert.deepEqual(outputChunks, ["What? "]);
  });

  it("trims whitespace from the answer", async () => {
    const input = new Readable({
      read() {
        this.push("  spaced  \n");
        this.push(null);
      },
    });
    const output = new Writable({
      write(_chunk, _encoding, callback) {
        callback();
      },
    });

    const { prompt, close } = createPrompt(input, output);
    const answer = await prompt("Name: ");
    close();

    assert.equal(answer, "spaced");
  });

  it("can be reused for multiple questions", async () => {
    let step = 0;
    const input = new Readable({
      read() {
        if (step === 0) {
          step++;
          setTimeout(() => this.push("one\n"), 10);
        } else if (step === 1) {
          step++;
          setTimeout(() => this.push("two\n"), 10);
        } else {
          this.push(null);
        }
      },
    });
    const output = new Writable({
      write(_chunk, _encoding, callback) {
        callback();
      },
    });

    const { prompt, close } = createPrompt(input, output);
    const first = await prompt("First: ");
    const second = await prompt("Second: ");
    close();

    assert.equal(first, "one");
    assert.equal(second, "two");
  });

  it("rejects pending questions with a prompt-closed error when input ends", async () => {
    const input = new Readable({
      read() {
        this.push(null);
      },
    });

    const { prompt, close } = createPrompt(input, silentOutput());
    try {
      await assert.rejects(prompt("Waiting: "), (error) => {
        assert.equal(error.code, "PROMPT_CLOSED");
        return true;
      });
    } finally {
      close();
    }
  });

  it("rejects new questions with a prompt-closed error after close()", async () => {
    const input = new Readable({ read() {} });

    const { prompt, close } = createPrompt(input, silentOutput());
    close();

    await assert.rejects(prompt("Late: "), (error) => isPromptClosedError(error));
  });
});

describe("isPromptClosedError", () => {
  it("recognizes prompt-closed errors by code regardless of the message", () => {
    const error = new Error("Entrada cerrada");
    error.code = PROMPT_CLOSED;
    assert.equal(isPromptClosedError(error), true);
  });

  it("does not match a generic error that only carries the English message", () => {
    assert.equal(isPromptClosedError(new Error("Prompt closed")), false);
  });

  it("returns false for missing values", () => {
    assert.equal(isPromptClosedError(undefined), false);
    assert.equal(isPromptClosedError(null), false);
  });
});
