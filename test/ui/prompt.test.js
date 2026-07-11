const { describe, it } = require("node:test");
const assert = require("node:assert/strict");
const { Readable, Writable } = require("node:stream");
const { createPrompt } = require("../../src/ui/prompt.js");

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
});
