# Tasks: Reliable and Secure Backups

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | 600-750 |
| 400-line budget risk | High |
| Chained PRs recommended | Yes |
| Suggested split | Single PR (expanded 800-line budget) |
| Delivery strategy | single-pr |
| Chain strategy | size-exception |

Decision needed before apply: No
Chained PRs recommended: Yes
Chain strategy: size-exception
400-line budget risk: High

### Suggested Work Units

| Unit | Goal | Likely PR | Focused test command | Runtime harness | Rollback boundary |
|------|------|-----------|----------------------|-----------------|-------------------|
| 1 | Foundation: config bounds, cancel token, fixture server | PR 1 | `npm test -- test/config.test.js` | `node test/helpers/fixture-server.js` smoke | `config.js`, `cancel-token.js`, `test/helpers/` |
| 2 | Secure viewer DOM-safe highlight | PR 1 | `npm test -- test/viewer-dom.test.js` | Playwright loads generated HTML fixture | `templates/viewer.html` |
| 3 | Robust downloader with redirects/retry/atomic writes | PR 1 | `npm test -- test/downloader.test.js` | Fixture server scripted responses | `downloader.js` |
| 4 | Safe interruption and SIGINT cleanup | PR 1 | `npm test -- test/interrupt.test.js` | Spawn `node backup.js` with fixture server | `backup.js` |

## Phase 1: Foundation

| TDD | Task |
|-----|------|
| RED | [x] 1.1 Write `test/config.test.js` asserting `apiBatchSize=101` and `50.5` throw `ConfigError`. |
| GREEN | [x] 1.2 In `config.js`, enforce `apiBatchSize <= 100` and `Number.isInteger`. |
| REFACTOR | [x] 1.3 Add `maxRetries`, `maxRedirects`, `retryDelayMs`, `jitterMaxMs` to `config.js` defaults. |
| RED | [x] 1.4 Write `test/cancel-token.test.js` for `createCancelToken` state, callbacks, and `throwIfCancelled`. |
| GREEN | [x] 1.5 Create `cancel-token.js` exporting `createCancelToken`. |
| RED | [x] 1.6 Write `test/fixture-server.test.js` asserting start/stop releases sockets. |
| GREEN | [x] 1.7 Create `test/helpers/fixture-server.js` with `startServer`/`stopServer` and configurable routes. |

## Phase 2: Secure Viewer

| TDD | Task |
|-----|------|
| RED | [x] 2.1 Write `test/viewer-dom.test.js` with XSS payload and `.*` regex; assert no `window.xss` and literal match. |
| GREEN | [x] 2.2 Replace `innerHTML` highlight in `templates/viewer.html` with text-node/Range `<mark>` wrapping. |
| REFACTOR | [x] 2.3 Preserve match count and clear-button behavior in the new highlighter. |

## Phase 3: Robust Downloader

| TDD | Task |
|-----|------|
| RED | [x] 3.1 Write `test/downloader.test.js` redirect-loop case using the fixture server. |
| GREEN | [x] 3.2 Add bounded redirects, `Location` resolution, and `http`/`https` protocol switching in `downloader.js`. |
| RED | [x] 3.3 Write retry cases: 503→success, 429→retry, 404 fails. |
| GREEN | [x] 3.4 Add exponential backoff+jitter retry for 5xx/429/network errors in `downloader.js`. |
| RED | [x] 3.5 Write stream-error cleanup case: abort response mid-stream. |
| GREEN | [x] 3.6 Write to `.part` files and `fs.rename` on success; unlink `.part` on any failure. |
| GREEN | [x] 3.7 Accept `cancelToken` in `downloadFile` and throw before each I/O step. |

## Phase 4: Safe Interruption

| TDD | Task |
|-----|------|
| RED | [x] 4.1 Write `test/interrupt.test.js` spawning `node backup.js` against the fixture server and sending SIGINT. |
| GREEN | [x] 4.2 Create a shared cancel token in `backup.js` and pass it through `downloadMedia` and `processChannel`. |
| GREEN | [x] 4.3 Replace the SIGINT handler to cancel the token, remove `.part` files, and exit with a nonzero code. |

## Phase 5: Verify

| TDD | Task |
|-----|------|
| N/A | [x] 5.1 Run `npm test` and fix any regressions. |
| N/A | [x] 5.2 Run `node backup.js --help` to confirm the CLI still loads. |
