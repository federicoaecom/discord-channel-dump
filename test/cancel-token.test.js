const { describe, it } = require("node:test");
const assert = require("node:assert/strict");
const { createCancelToken, createCancelError, isCancelError } = require("../src/cancel-token.js");

describe("createCancelToken", () => {
  it("starts uncancelled", () => {
    const token = createCancelToken();
    assert.equal(token.isCancelled(), false);
  });

  it("becomes cancelled after cancel()", () => {
    const token = createCancelToken();
    token.cancel();
    assert.equal(token.isCancelled(), true);
  });

  it("calls registered onCancel callbacks", () => {
    const token = createCancelToken();
    let called = false;
    token.onCancel(() => {
      called = true;
    });
    token.cancel();
    assert.equal(called, true);
  });

  it("invokes callbacks registered after cancellation immediately", () => {
    const token = createCancelToken();
    token.cancel();
    let called = false;
    token.onCancel(() => {
      called = true;
    });
    assert.equal(called, true);
  });

  it("throwIfCancelled throws after cancellation", () => {
    const token = createCancelToken();
    token.cancel();
    assert.throws(() => token.throwIfCancelled(), /Cancelled/);
  });

  it("throwIfCancelled does nothing when not cancelled", () => {
    const token = createCancelToken();
    assert.doesNotThrow(() => token.throwIfCancelled());
  });

  it("throwIfCancelled throws an error with the cancel identity", () => {
    const token = createCancelToken();
    token.cancel();
    assert.throws(
      () => token.throwIfCancelled(),
      (error) => isCancelError(error)
    );
  });
});

describe("isCancelError", () => {
  it("recognizes cancel errors by identity regardless of the message", () => {
    assert.equal(isCancelError(createCancelError("Descarga cancelada")), true);
  });

  it("does not treat a generic error that mentions cancellation as a cancel error", () => {
    assert.equal(isCancelError(new Error("Request cancelled by peer")), false);
  });

  it("returns false for missing or non-error values", () => {
    assert.equal(isCancelError(undefined), false);
    assert.equal(isCancelError(null), false);
    assert.equal(isCancelError("CancelError"), false);
  });
});
