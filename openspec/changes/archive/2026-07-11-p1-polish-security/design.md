# Design: P1 Polish and Security Improvements

## Change

`p1-polish-security`

## Architectural Decisions

### 1. Split `src/utils.js` into a barrel of focused modules

**Decision**: Move each responsibility into its own module and keep `src/utils.js` as a backwards-compatible re-export barrel.

**Rationale**: `src/utils.js` currently contains unrelated concerns: filename sanitization, HTML escaping, filename generation, icon mapping, and HTML generation. Splitting makes each piece independently testable and easier to find.

**Rationale for barrel**: Existing code and tests import from `src/utils.js`. Keeping the barrel avoids a massive import-update diff and reduces risk.

**New modules**:

- `src/utils/sanitize.js` — `sanitize(name)`
- `src/utils/html.js` — `escapeHtml(str)`
- `src/utils/filenames.js` — `filenameFromUrl(rawUrl)`, `uniqueFilename(dir, filename)`
- `src/utils/icons.js` — `iconFor(filename)`
- `src/utils/fs.js` — `ensureDir(path)`
- `src/viewer/render.js` — `generateHtml(channelName, messages)`

`src/utils.js` will re-export all of them for backwards compatibility.

### 2. Harden the viewer with CSP and safer external links

**Decision**: Add a `Content-Security-Policy` meta tag and `rel="noopener noreferrer"` to all `target="_blank"` links.

**Rationale**: The viewer is a static HTML file opened from `file:///`. A CSP reduces the impact of any injected content. `noopener noreferrer` prevents the opened tab from accessing `window.opener`.

**CSP choice**: Since the viewer uses an inline script, the policy must allow `script-src 'unsafe-inline'`. The strictest reasonable policy is:

```html
<meta http-equiv="Content-Security-Policy" content="default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; connect-src 'none'; frame-src 'none';">
```

This allows:
- Scripts and styles from the local file and inline.
- Images from the local file and data URIs.
- Nothing from the network (no `connect-src`).
- No iframes.

**Links**: All `<a target="_blank">` get `rel="noopener noreferrer"`.

### 3. Improve terminal UX with colors and a progress bar

**Decision**: Add a small `src/ui/colors.js` module with ANSI helpers and a `src/ui/progress.js` module for progress bar rendering. Update `src/output/writer.js` and `src/app.js` to use them.

**Rationale**: Terminal output is currently plain text and the progress line is dense. Colors and a progress bar make the tool feel more professional and make errors/warnings stand out.

**Color implementation**: ANSI escape codes wrapped in a helper that checks `process.stdout.isTTY`. No new dependencies.

**Progress bar**: A simple single-line bar with `[████...]` and percent/bytes/ETA. It overwrites itself with `\r` like the current counters.

### 4. Keep CLI behavior unchanged

**Decision**: The interactive flow and flags remain the same. This is a polish and security pass, not a feature redesign.

## Module Interfaces

### `src/utils/sanitize.js`

```js
function sanitize(name) { /* ... */ }
module.exports = { sanitize };
```

### `src/utils/html.js`

```js
function escapeHtml(s) { /* ... */ }
module.exports = { escapeHtml };
```

### `src/utils/filenames.js`

```js
function filenameFromUrl(rawUrl) { /* ... */ }
function uniqueFilename(dir, filename) { /* ... */ }
module.exports = { filenameFromUrl, uniqueFilename };
```

### `src/utils/icons.js`

```js
function iconFor(filename) { /* ... */ }
module.exports = { iconFor };
```

### `src/viewer/render.js`

```js
function generateHtml(channelName, messages) { /* ... */ }
module.exports = { generateHtml };
```

### `src/utils.js` (barrel)

```js
module.exports = {
  ...require("./utils/sanitize"),
  ...require("./utils/html"),
  ...require("./utils/filenames"),
  ...require("./utils/icons"),
  ...require("./utils/fs"),
  ...require("./viewer/render"),
};
```

### `src/ui/colors.js`

```js
function red(text) { /* ... */ }
function green(text) { /* ... */ }
function yellow(text) { /* ... */ }
function cyan(text) { /* ... */ }
function dim(text) { /* ... */ }
module.exports = { red, green, yellow, cyan, dim };
```

### `src/ui/progress.js`

```js
function renderProgressBar(percent, options = {}) { /* ... */ }
function formatBytes(bytes) { /* ... */ }
function formatEta(ms) { /* ... */ }
module.exports = { renderProgressBar, formatBytes, formatEta };
```

## Testing Strategy

| Module | Test Approach |
|---|---|
| `src/utils/*.js` | Unit tests with known inputs/outputs. |
| `src/viewer/render.js` | Unit tests matching existing `utils.test.js` cases. |
| `src/templates/viewer.html` | Static parse test for CSP meta and `rel` attributes. |
| `src/ui/colors.js` | Unit tests with TTY detection and output capture. |
| `src/ui/progress.js` | Unit tests for format helpers and bar rendering. |
| `src/output/writer.js` | Update progress tests to assert new bar output. |
| `src/app.js` | Smoke tests still pass; colored messages are assertions. |

## Cross-Platform Considerations

- ANSI codes are supported in modern Windows Terminal and most CI environments. We guard with `isTTY` to avoid emitting codes when piping.
- `path.posix.basename` is used in `filenameFromUrl` as before.

## Dependencies

No new runtime dependencies.
