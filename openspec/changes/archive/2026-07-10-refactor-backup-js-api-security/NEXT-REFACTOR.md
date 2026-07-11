# Next Up: Refactor `bin/backup.js` and Move Discord API Calls to Node Context

> **STATUS: IMPLEMENTED** — 2026-07-10. See `src/app.js`, `src/api/discord.js`, `src/browser/session.js`, `src/output/writer.js`, `src/messages/normalize.js`, `src/ui/prompt.js`, and `src/cli/backup-args.js`.
> Captured: 2026-07-10  
> Priority: P0  
> Theme: Architecture, security, and maintainability

## 1. Why this matters

`bin/backup.js` currently mixes five different concerns in one file:

1. CLI argument parsing and help/version output
2. Browser launch and session management
3. Discord API message fetching
4. Media download orchestration
5. Interactive terminal prompts and the main loop

At 578 lines, it is the single biggest maintenance risk in the project. It is also hard to unit test and hard to reason about. Most importantly, Discord API calls are executed inside the browser page context via `page.evaluate()`, which exposes the user's authorization token to the page's JavaScript context.

## 2. Security problem with the current design

The token is captured by listening to outgoing browser requests:

```js
page.on("request", (req) => {
  if (!token && req.url().includes("discord.com/api")) {
    const auth = req.headers()["authorization"];
    if (auth && auth.length > 10) token = auth;
  }
});
```

Then it is passed back into the page to make API calls:

```js
await page.evaluate(async ({ channelId, token }) => {
  const res = await fetch(`/api/v9/channels/${channelId}`, {
    headers: { Authorization: token },
  });
  // ...
}, { channelId, token });
```

This means the token is available to the page context. If Discord's front-end is compromised, a third-party browser extension is active, or CSP changes unexpectedly, the token could be leaked.

**Goal**: make every API request from the Node.js process using Playwright's `context.request` or `page.context().request`, and only use the browser for authentication and navigation.

## 3. Proposed structure

After the refactor, `bin/backup.js` should be a thin CLI wrapper:

```
bin/
  backup.js          # parse args, print help, load config, start main()
src/
  config.js          # (exists) tunables + validation
  api/
    discord.js       # all Discord API calls: fetchAllMessages, getChannelName
  browser/
    session.js       # launch browser, capture token, getChannelId
  messages/
    normalize.js     # normalizeMessage
  downloader/
    http.js          # downloadFile (already exists)
  output/
    writer.js        # write messages.json + index.html
  ui/
    prompt.js        # readline helpers
  app.js             # interactive capture loop + process orchestration
```

### New files

- `src/browser/session.js`
  - `launchBrowser(profileDir)`
  - `startTokenCapture(page)`
  - `getChannelId(page)`
  - `getChannelName(page)` (DOM fallback only)
- `src/api/discord.js`
  - `fetchAllMessages(request, token, channelId, config)`
  - `getChannelName(request, token, channelId)` (API-first)
- `src/messages/normalize.js`
  - `normalizeMessage(message)`
- `src/output/writer.js`
  - `saveChannel(channelName, messages, config)`
- `src/ui/prompt.js`
  - `prompt(question)`
  - `confirmChannel(channelName)`
- `src/app.js`
  - `runBrowserSession(config)` — the current interactive loop and orchestration
- `src/index.js` (optional)
  - Re-exports the public API for programmatic use

### `bin/backup.js` after refactor

```js
const config = require("../src/config");
const { parseCliArgs, printHelp, printVersion } = require("../src/cli/backup-args");
const { applyOverrides } = require("../src/config/overrides");
const { runBrowserSession } = require("../src/app");

async function main(argv) {
  const args = parseCliArgs(argv);
  // ...
  applyOverrides(config, args);
  config.validateConfig(config);
  await runBrowserSession(config);
}
```

## 4. Token flow after refactor

```
1. Browser opens and navigates to Discord.
2. Token is captured from outgoing browser requests.
3. Token is stored only in the Node process memory.
4. All Discord API calls are made with `context.request` or `page.context().request`.
5. Browser is only used for: login, navigation, and channel detection.
```

This keeps the token out of the page context and makes the API layer independently testable.

## 5. Tests to add or update

- Unit tests for `src/api/discord.js` using a local HTTP fixture server and mocked `request` object.
- Unit tests for `src/browser/session.js` using Playwright to launch a real browser and capture a token.
- Move current `processChannel` tests to the new output module.
- Update `cli.test.js` to import from the new argument module.
- Keep existing smoke tests green.

## 6. Acceptance criteria

- `bin/backup.js` is under 150 lines.
- No `page.evaluate()` calls that make network requests with the token.
- Token is only used from the Node.js process context.
- All existing tests pass.
- New tests cover the API module and browser session module.
- Lint and format clean.
- CLI behavior remains unchanged for the user.

## 7. Risks and mitigations

| Risk | Mitigation |
|---|---|
| Browser context request API differs from `fetch` | Use Playwright's `request` API; it has similar headers and cookies handling. |
| Token capture still works the same way | Keep `page.on('request', ...)` listener unchanged. |
| Refactor breaks existing tests | Move tests incrementally; keep smoke tests as guard. |
| Interactive prompts need module-level readline | Move `readline` creation into `src/ui/prompt.js` and expose `close()`. |
| `processChannel` is exported for tests | Move it to `src/output/writer.js` and export it there. |

## 8. Suggested work units

1. Extract CLI parsing to `src/cli/backup-args.js`.
2. Extract `prompt` / `confirmChannel` to `src/ui/prompt.js`.
3. Extract `normalizeMessage` to `src/messages/normalize.js`.
4. Extract `launchBrowser`, `tokenCapture`, `getChannelId` to `src/browser/session.js`.
5. Create `src/api/discord.js` with `request`-based API calls.
6. Create `src/output/writer.js` with `saveChannel`.
7. Create `src/app.js` with the main interactive loop.
8. Thin down `bin/backup.js`.
9. Update tests and add new ones.
10. Run full verify suite.

## 9. Notes

- This is a P0 architectural change. It should be done with SDD to keep the review focused and traceable.
- Estimated changed lines: 600–900, so it may need a size exception or chained PR.
- The user has already approved size exceptions for previous changes, but this should be discussed before applying.
- See `README.md` and `AGENTS.md` for current project conventions.
