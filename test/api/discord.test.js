const { describe, it, beforeEach, afterEach } = require("node:test");
const assert = require("node:assert/strict");
const { getChannelName, fetchAllMessages } = require("../../src/api/discord.js");
const { DEFAULT_LANGUAGE, setLanguage } = require("../../src/i18n");

// The active language is module-level state; reset it so tests stay independent.
afterEach(() => {
  setLanguage(DEFAULT_LANGUAGE);
});

function createFakeRequest(responses) {
  return {
    async get(url, options = {}) {
      const match = responses.find((r) => url.includes(r.match));
      if (!match) {
        return {
          ok: false,
          status: 404,
          text: async () => "Not Found",
          json: async () => ({}),
        };
      }
      return match.handler(url, options);
    },
  };
}

describe("getChannelName", () => {
  it("returns the channel name from the API response", async () => {
    const request = createFakeRequest([
      {
        match: "/api/v9/channels/",
        handler: () => ({
          ok: true,
          status: 200,
          json: async () => ({ id: "123", name: "general" }),
          text: async () => JSON.stringify({ id: "123", name: "general" }),
        }),
      },
    ]);

    const name = await getChannelName(request, "token", "123");
    assert.equal(name, "general");
  });

  it("returns null when the API request fails", async () => {
    const request = createFakeRequest([
      {
        match: "/api/v9/channels/",
        handler: () => ({
          ok: false,
          status: 403,
          json: async () => ({}),
          text: async () => "Forbidden",
        }),
      },
    ]);

    const name = await getChannelName(request, "token", "123");
    assert.equal(name, null);
  });

  it("propagates network errors", async () => {
    const request = {
      async get() {
        throw new Error("net::ERR_CONNECTION_REFUSED");
      },
    };

    await assert.rejects(getChannelName(request, "token", "123"), /net::ERR_CONNECTION_REFUSED/);
  });

  it("propagates malformed JSON responses", async () => {
    const request = createFakeRequest([
      {
        match: "/api/v9/channels/",
        handler: () => ({
          ok: true,
          status: 200,
          json: async () => {
            throw new Error("Unexpected token in JSON");
          },
          text: async () => "not json",
        }),
      },
    ]);

    await assert.rejects(getChannelName(request, "token", "123"), /Unexpected token in JSON/);
  });

  it("sends the Authorization header", async () => {
    let capturedHeaders;
    const request = createFakeRequest([
      {
        match: "/api/v9/channels/",
        handler: (_url, options) => {
          capturedHeaders = options.headers;
          return {
            ok: true,
            status: 200,
            json: async () => ({ name: "general" }),
            text: async () => "",
          };
        },
      },
    ]);

    await getChannelName(request, "Bearer abc", "123");
    assert.equal(capturedHeaders.Authorization, "Bearer abc");
    assert.equal(capturedHeaders["Content-Type"], "application/json");
  });
});

describe("fetchAllMessages", () => {
  // These tests assert the English text; the Spanish default is covered below.
  beforeEach(() => {
    setLanguage("en");
  });

  it("fetches paginated messages and returns them oldest-first", async () => {
    const messages = [
      { id: "1", content: "oldest" },
      { id: "2", content: "middle" },
      { id: "3", content: "newest" },
    ];
    const request = createFakeRequest([
      {
        match: "/api/v9/channels/123/messages",
        handler: (url) => {
          const hasBefore = url.includes("before=");
          const body = hasBefore ? [messages[0]] : messages.slice(1);
          return {
            ok: true,
            status: 200,
            json: async () => body,
            text: async () => JSON.stringify(body),
          };
        },
      },
    ]);

    const result = await fetchAllMessages(request, "token", "123", {
      apiBatchSize: 2,
      apiDelayMs: 0,
    });

    assert.equal(result.length, 3);
    assert.equal(result[0].id, "1");
    assert.equal(result[2].id, "3");
  });

  it("handles rate limits by retrying after retry_after", async () => {
    let call = 0;
    const request = createFakeRequest([
      {
        match: "/api/v9/channels/123/messages",
        handler: () => {
          call++;
          if (call === 1) {
            return {
              ok: false,
              status: 429,
              json: async () => ({ retry_after: 0.05 }),
              text: async () => JSON.stringify({ retry_after: 0.05 }),
            };
          }
          return {
            ok: true,
            status: 200,
            json: async () => [{ id: "1", content: "hi" }],
            text: async () => '[{"id":"1"}]',
          };
        },
      },
    ]);

    const result = await fetchAllMessages(request, "token", "123", {
      apiBatchSize: 50,
      apiDelayMs: 0,
    });

    assert.equal(result.length, 1);
    assert.equal(call, 2);
  });

  it("throws on non-retryable API errors", async () => {
    const request = createFakeRequest([
      {
        match: "/api/v9/channels/123/messages",
        handler: () => ({
          ok: false,
          status: 403,
          json: async () => ({}),
          text: async () => "Forbidden",
        }),
      },
    ]);

    await assert.rejects(
      fetchAllMessages(request, "token", "123", { apiBatchSize: 50, apiDelayMs: 0 }),
      /API 403/
    );
  });

  it("propagates network errors", async () => {
    const request = {
      async get() {
        throw new Error("net::ERR_CONNECTION_REFUSED");
      },
    };

    await assert.rejects(
      fetchAllMessages(request, "token", "123", { apiBatchSize: 50, apiDelayMs: 0 }),
      /net::ERR_CONNECTION_REFUSED/
    );
  });

  it("propagates request timeouts", async () => {
    const request = {
      async get() {
        const err = new Error("Timeout 30000ms exceeded");
        err.name = "TimeoutError";
        throw err;
      },
    };

    await assert.rejects(
      fetchAllMessages(request, "token", "123", { apiBatchSize: 50, apiDelayMs: 0 }),
      /Timeout/
    );
  });

  it("propagates malformed JSON responses", async () => {
    const request = createFakeRequest([
      {
        match: "/api/v9/channels/123/messages",
        handler: () => ({
          ok: true,
          status: 200,
          json: async () => {
            throw new Error("Unexpected token in JSON");
          },
          text: async () => "not json",
        }),
      },
    ]);

    await assert.rejects(
      fetchAllMessages(request, "token", "123", { apiBatchSize: 50, apiDelayMs: 0 }),
      /Unexpected token in JSON/
    );
  });

  it("returns empty array when the response body is not an array", async () => {
    const request = createFakeRequest([
      {
        match: "/api/v9/channels/123/messages",
        handler: () => ({
          ok: true,
          status: 200,
          json: async () => ({ error: "not an array" }),
          text: async () => JSON.stringify({ error: "not an array" }),
        }),
      },
    ]);

    const result = await fetchAllMessages(request, "token", "123", {
      apiBatchSize: 50,
      apiDelayMs: 0,
    });

    assert.equal(result.length, 0);
  });

  it("stops when fewer messages than batch size are returned", async () => {
    const request = createFakeRequest([
      {
        match: "/api/v9/channels/123/messages",
        handler: () => ({
          ok: true,
          status: 200,
          json: async () => [{ id: "1", content: "only" }],
          text: async () => '[{"id":"1"}]',
        }),
      },
    ]);

    const result = await fetchAllMessages(request, "token", "123", {
      apiBatchSize: 50,
      apiDelayMs: 0,
    });

    assert.equal(result.length, 1);
  });
});

describe("fetchAllMessages terminal output", () => {
  function rateLimitedThenOk() {
    let call = 0;
    return createFakeRequest([
      {
        match: "/api/v9/channels/123/messages",
        handler: () => {
          call++;
          if (call === 1) {
            return {
              ok: false,
              status: 429,
              json: async () => ({ retry_after: 0.05 }),
              text: async () => "",
            };
          }
          return {
            ok: true,
            status: 200,
            json: async () => [{ id: "1" }, { id: "2" }],
            text: async () => "",
          };
        },
      },
    ]);
  }

  function forbidden() {
    return createFakeRequest([
      {
        match: "/api/v9/channels/123/messages",
        handler: () => ({
          ok: false,
          status: 403,
          json: async () => ({}),
          text: async () => "Missing Access",
        }),
      },
    ]);
  }

  async function captureFetch(request) {
    const chunks = [];
    const originalWrite = process.stdout.write;
    process.stdout.write = (chunk) => {
      chunks.push(String(chunk));
      return true;
    };
    try {
      await fetchAllMessages(request, "token", "123", { apiBatchSize: 50, apiDelayMs: 0 });
    } finally {
      process.stdout.write = originalWrite;
    }
    return chunks.join("");
  }

  it("prints the rate-limit wait and page progress in English", async () => {
    setLanguage("en");
    const output = await captureFetch(rateLimitedThenOk());
    assert.ok(output.includes("\n  [rate limit] waiting 0.3s…"), output);
    assert.ok(output.includes("\r  Page 1: 2 messages fetched...   "), output);
  });

  it("prints the rate-limit wait and page progress in Spanish by default", async () => {
    const output = await captureFetch(rateLimitedThenOk());
    assert.ok(output.includes("\n  [límite de solicitudes] esperando 0.3s…"), output);
    assert.ok(output.includes("\r  Página 1: 2 mensajes obtenidos...   "), output);
  });

  it("keeps the server text in the English API error", async () => {
    setLanguage("en");
    await assert.rejects(captureFetch(forbidden()), (error) => {
      assert.equal(error.message, "API 403: Missing Access");
      return true;
    });
  });

  it("keeps the server text in the Spanish API error", async () => {
    await assert.rejects(captureFetch(forbidden()), (error) => {
      assert.equal(error.message, "La API respondió 403: Missing Access");
      return true;
    });
  });
});
