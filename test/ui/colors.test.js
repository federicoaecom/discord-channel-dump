const { describe, it, before, after } = require("node:test");
const assert = require("node:assert/strict");

describe("colors", () => {
  let originalIsTty;
  let originalNoColor;

  before(() => {
    originalIsTty = process.stdout.isTTY;
    originalNoColor = process.env.NO_COLOR;
  });

  after(() => {
    process.stdout.isTTY = originalIsTty;
    if (originalNoColor === undefined) {
      delete process.env.NO_COLOR;
    } else {
      process.env.NO_COLOR = originalNoColor;
    }
  });

  function loadColors() {
    // Delete the module from cache so each test loads fresh state.
    delete require.cache[require.resolve("../../src/ui/colors.js")];
    return require("../../src/ui/colors.js");
  }

  it("returns plain text when stdout is not a TTY", () => {
    process.stdout.isTTY = false;
    delete process.env.NO_COLOR;
    const { red, green } = loadColors();
    assert.equal(red("error"), "error");
    assert.equal(green("ok"), "ok");
  });

  it("returns ANSI-wrapped text when stdout is a TTY", () => {
    process.stdout.isTTY = true;
    delete process.env.NO_COLOR;
    const { red, green, yellow, cyan, dim } = loadColors();
    assert.equal(red("error"), "\x1b[31merror\x1b[0m");
    assert.equal(green("ok"), "\x1b[32mok\x1b[0m");
    assert.equal(yellow("warn"), "\x1b[33mwarn\x1b[0m");
    assert.equal(cyan("info"), "\x1b[36minfo\x1b[0m");
    assert.equal(dim("muted"), "\x1b[2mmuted\x1b[0m");
  });

  it("returns plain text when NO_COLOR is set", () => {
    process.stdout.isTTY = true;
    process.env.NO_COLOR = "1";
    const { red } = loadColors();
    assert.equal(red("error"), "error");
  });
});
