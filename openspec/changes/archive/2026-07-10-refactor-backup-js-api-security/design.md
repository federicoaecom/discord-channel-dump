# Design: Refactor `bin/backup.js` and Move Discord API Calls to Node Context

## Change

`refactor-backup-js-api-security`

## Architectural Decisions

### 1. Use Playwright's Node-side `request` context for all Discord API calls

**Decision**: Replace `page.evaluate()` calls that fetch Discord data with `context.request` or a standalone `request` object created from the browser context.

**Rationale**: The authorization token is captured from outgoing browser requests, but it should never be passed back into the page context. Keeping requests in Node reduces the attack surface if the Discord front-end is compromised.

**Consequences**: `src/api/discord.js` will accept a `request` object and a `token` string. It will not depend on the `page` object. This makes it independently testable using a mock or fixture server.

### 2. Split the monolithic `bin/backup.js` into focused modules

**Decision**: Move each responsibility into its own module under `src/`.

**Rationale**: Single Responsibility Principle. Each module becomes easier to test, reason about, and change.

**Modules**:

- `src/cli/backup-args.js` — CLI parsing, help, version.
- `src/ui/prompt.js` — readline prompts.
- `src/browser/session.js` — browser launch, token capture, channel ID detection.
- `src/api/discord.js` — Discord REST API calls.
- `src/messages/normalize.js` — transform Discord API messages into our format.
- `src/output/writer.js` — write `messages.json` and `index.html`.
- `src/app.js` — interactive orchestration.

### 3. Keep `bin/backup.js` as a thin CLI wrapper

**Decision**: `bin/backup.js` should only parse CLI arguments, apply config overrides, validate config, and call `src/app.js`.

**Rationale**: Entry points should not contain business logic. This also makes programmatic use easier in the future.

### 4. Keep existing module boundaries where they are healthy

**Decision**: `src/config.js`, `src/utils.js`, `src/downloader.js`, and `src/cancel-token.js` are not part of this refactor.

**Rationale**: They are already focused enough. `src/utils.js` is a kitchen sink, but splitting it is a separate concern and out of scope for this change.

### 5. Preserve the interactive terminal flow

**Decision**: The user-facing loop remains unchanged. The prompt text, the "press ENTER to capture" behavior, and the confirmation step are preserved.

**Rationale**: This is a refactoring, not a UX redesign. Changing the flow would require user acceptance testing beyond automated tests.

## Sequence Diagram (New Flow)

```
User
  |
  v
bin/backup.js
  |
  v
src/cli/backup-args.js --parse args--
  |
  v
src/app.js --runBrowserSession--
  |
  +-- src/browser/session.js --launchBrowser, capture token, detect channel ID
  |
  +-- src/ui/prompt.js --wait for user input
  |
  +-- src/api/discord.js --getChannelName, fetchAllMessages (Node context)
  |
  +-- src/messages/normalize.js --normalize messages
  |
  +-- src/output/writer.js --write messages.json + index.html
  |
  +-- src/downloader.js --download images/attachments
```

## Token Flow

```
1. Browser opens Discord.
2. Browser makes API request; `page.on('request')` captures `Authorization` header.
3. Token is stored in a Node variable.
4. Node calls `context.request.get('/api/v9/channels/...', { headers: { Authorization: token } })`.
5. Token is never serialized to disk or passed to the page.
6. On shutdown, the browser context is closed and the token is discarded.
```

## Module Interfaces

### `src/cli/backup-args.js`

```js
function parseCliArgs(argv) { /* returns { help, version, output, profile, error } */ }
function printHelp() { /* writes to stdout */ }
function printVersion() { /* writes to stdout */ }
module.exports = { parseCliArgs, printHelp, printVersion };
```

### `src/ui/prompt.js`

```js
function createPrompt() { /* returns { prompt, close } */ }
module.exports = { createPrompt };
```

### `src/browser/session.js`

```js
async function launchBrowser(profileDir) { /* returns { context, page, session } */ }
async function getChannelId(page) { /* returns string | null */ }
async function getChannelNameFromDom(page) { /* returns string */ }
module.exports = { launchBrowser, getChannelId, getChannelNameFromDom };
```

Where `session` has:

```js
{ getToken: () => string | null }
```

### `src/api/discord.js`

```js
async function getChannelName(request, token, channelId) { /* returns string | null */ }
async function fetchAllMessages(request, token, channelId, config) { /* returns raw API messages[] */ }
module.exports = { getChannelName, fetchAllMessages };
```

The `request` object is a Playwright API request context (e.g., `context.request`).

### `src/messages/normalize.js`

```js
function normalizeMessage(message) { /* returns normalized object */ }
module.exports = { normalizeMessage };
```

### `src/output/writer.js`

```js
async function saveChannel(channelName, messages, config) { /* writes files */ }
module.exports = { saveChannel };
```

### `src/app.js`

```js
async function runBrowserSession(config) { /* interactive loop */ }
module.exports = { runBrowserSession };
```

## State Management

- `cancelToken` is created once at the top of `bin/backup.js` and passed down to `app.js` and `downloader.js`.
- `readline` interface is created once in `app.js` and closed when the loop ends.
- Browser context is created once per session and closed when the user exits.

## Error Handling

- API errors (403, 429, 5xx) are handled inside `src/api/discord.js` and returned or thrown as domain errors.
- Network errors during download are handled by `src/downloader.js`.
- Shutdown errors are ignored gracefully (existing behavior).
- All errors propagate up to `bin/backup.js` and result in a non-zero exit code.

## Testing Strategy

| Module | Test Approach |
|---|---|
| `src/cli/backup-args.js` | Unit tests for parsing; smoke tests for `--help`/`--version`. |
| `src/ui/prompt.js` | Unit tests with a mock readline or child process. |
| `src/browser/session.js` | Playwright test with a local HTML file to capture a fake token. |
| `src/api/discord.js` | Local HTTP fixture server that returns Discord-like payloads and errors. |
| `src/messages/normalize.js` | Unit tests with sample API messages. |
| `src/output/writer.js` | Unit tests that write to a temp directory and read back. |
| `src/app.js` | Integration test with stubbed modules; smoke test with real CLI. |

## Cross-Platform Considerations

- All paths continue to use `path.join()` / `path.resolve()`.
- The Playwright request API is cross-platform.
- Tests must pass on Windows and Ubuntu (CI matrix is Node 18 and 20 on Ubuntu).

## Dependencies

No new runtime dependencies are added. The refactor uses Playwright APIs already available in the project (`chromium.launchPersistentContext`, `context.request`).

## Open Questions

- Should we expose a `src/index.js` public API? Defer to a future change.
- Should `regen-html.js` also be refactored to use the new `output/writer.js` module? Out of scope for this change.

## Design Acceptance Criteria

- The new module boundaries match the sequence diagram.
- The token never flows into `page.evaluate()`.
- All new modules are testable in isolation.
- Existing smoke tests continue to pass without modification.
