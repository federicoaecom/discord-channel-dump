# Design: Reliable and Secure Backups

## Technical Approach

Implement the five capabilities from the proposal as focused, test-driven changes to existing modules. The viewer highlighter is replaced with DOM-safe text-node fragments. The downloader is rebuilt around a small internal HTTP client with bounded redirects, retry/backoff, atomic writes, and cancellation. A cancellation token is threaded through `backup.js` so SIGINT aborts in-flight work, removes `.part` files, and exits nonzero. `config.js` enforces Discord's `apiBatchSize` limit and adds retry tunables. All risk-heavy paths are verified with a local HTTP fixture server and `node:test`.

## Architecture Decisions

| Decision | Choice | Alternatives | Rationale |
|---|---|---|---|
| Viewer highlight | Text-node `Range` fragments wrapped in `<mark>` | `innerHTML` with pre-escaped strings | Eliminates HTML parsing of message-derived strings; spec requires DOM-safe only. |
| Downloader client | Built-in `http`/`https` with protocol switching per redirect | External fetch library (e.g., undici) | No new runtime dependencies; keeps control over redirect/retry policy. |
| Redirect resolution | Resolve `Location` against current request URL with a cap | Follow raw header string | Required for relative URLs and cross-protocol redirects; prevents loops. |
| Retry classification | Retry 5xx, 429, network errors; fail on 4xx except 429 | Retry all errors | Avoids masking permanent failures like 404 while respecting rate limits. |
| Atomic writes | Stream to `.part` and `fs.rename` on success | Write directly to destination | Partial files are never visible as final output; rename is near-atomic on target OS. |
| Cancellation | Shared cancel token passed to `downloadFile` and checked before I/O | Process.exit only | Allows cleanup of `.part` files and deterministic nonzero exit. |
| Test fixtures | Local `http.createServer` in `test/helpers/fixture-server.js` | Mock `http` module | Exercises real socket/stream behavior without Discord credentials. |

## Data Flow

```
SIGINT ──→ backup.js ──→ cancelToken.cancel()
                              │
                              ↓
downloadFile(url, dest, token) ──→ resolve URL ──→ http/https GET
       │                                │
       │                                ↓
       │                         follow redirect? → recurse (max 10)
       │                                ↓
       │                         transient error? → retry w/ backoff+jitter
       │                                ↓
       │                         stream to dest.part
       │                                │
       └───────────────── abort? ──→ unlink .part, throw
                                      │
                                      ↓
                              rename dest.part → dest
```

## File Changes

| File | Action | Description |
|---|---|---|
| `templates/viewer.html` | Modify | Replace `innerHTML` highlight with text-node/Range `<mark>` wrapping. |
| `downloader.js` | Modify | Add bounded redirects, retry/backoff, atomic `.part` writes, cleanup, cancellation. |
| `backup.js` | Modify | Create cancel token, register `.part` files, SIGINT cleanup, nonzero exit. |
| `config.js` | Modify | Enforce `apiBatchSize <= 100` and integer-only; add retry/redirect tunables. |
| `test/helpers/fixture-server.js` | Create | Configurable local HTTP server for downloader/interrupt tests. |
| `test/downloader.test.js` | Create | Redirects, retries, 4xx failures, stream errors, atomic writes. |
| `test/interrupt.test.js` | Create | SIGINT cancellation and `.part` cleanup via spawned process. |
| `test/viewer-dom.test.js` | Create | Playwright loads generated HTML and proves no XSS via search. |

## Interfaces / Contracts

```js
// downloader.js
function downloadFile(url, destPath, {
  cancelToken,
  maxRedirects = 10,
  maxRetries = 3,
  retryDelayMs = 1000,
  jitterMaxMs = 500,
  timeoutMs = 20000,
} = {})

// Cancellation token
function createCancelToken() // returns { isCancelled, cancel, onCancel, throwIfCancelled }

// Fixture server (test/helpers/fixture-server.js)
async function startServer(port, routes) // routes: [{ path, status, body, headers, delayMs, redirectTo }]
async function stopServer(server)
```

## Testing Strategy

| Layer | What to Test | Approach |
|---|---|---|
| Unit | `validateConfig` bounds, integer check, new retry tunables | `node:test` assertions on valid/invalid values. |
| Unit | `createCancelToken` state, callbacks, `throwIfCancelled` | Direct instantiation and mutation tests. |
| Integration | Downloader: relative/cross-protocol redirects, 503→success, 429→retry, 404 fail, stream-error cleanup | `fixture-server` serves scripted responses; assert final file contents and no `.part` remnants. |
| Integration | Interruption: throttled download is cancelled by SIGINT | Spawn `node backup.js --output tmp`; send SIGINT; assert nonzero exit and no `.part` files. |
| E2E | Viewer search does not execute scripts from message text | Playwright loads generated HTML, searches for malicious text, asserts `window.xss` is undefined. |

## Threat Matrix

| Boundary | Minimum adversarial cases | Applicability | Design response | Planned RED tests |
|---|---|---|---|---|
| Documentation-like paths | `requirements.txt`, `CMakeLists.txt`, executable Markdown/MDX, `README.sh` | N/A — change does not classify or execute files by extension. | — | — |
| Git repository selection | `git -C`, relative paths, absolute paths | N/A — change does not invoke Git or select repositories. | — | — |
| Commit state | staged, `commit -a`, empty index | N/A — no VCS automation. | — | — |
| Push state | tracking branch, first push, explicit refspec | N/A — no VCS automation. | — | — |
| PR commands | explicit `--head`, environment prefix, composed commands | N/A — no PR or shell-command automation. | — | — |

**Applicable process/file-system boundaries outside the matrix:**

| Boundary | Safe behavior | Failure behavior | RED test |
|---|---|---|---|
| SIGINT during download | Cancel token, delete `.part` files, exit nonzero. | Orphan `.part` files or exit 0. | Spawn process, send SIGINT mid-download, assert `status !== 0` and `glob('*.part').length === 0`. |
| Stream error mid-download | Remove `.part`, destination not created. | Partial file left as final. | Fixture aborts response; assert no `.part` and destination missing. |
| Redirect loop | Stop after `maxRedirects`, throw error, no `.part` left. | Stack overflow or infinite request chain. | Fixture returns endless 302; assert error and cleanup. |

## Migration / Rollout

No migration required. Existing backup folders remain valid; the viewer change is backward-compatible. New `config.js` tunables use safe defaults (`maxRetries: 3`, `maxRedirects: 10`).

## Open Questions

- None.
