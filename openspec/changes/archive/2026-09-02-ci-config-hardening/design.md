# Design: CI and Config Hardening

## Change

`ci-config-hardening`

## Architectural Decisions

### 1. Enforce the modern Node.js baseline and install Playwright Chromium in CI

**Decision**: Declare `^20.19.0 || ^22.13.0 || >=24` in `package.json`, run CI on Node `20.x`, `22.x`, and `24.x`, and add `npx playwright install chromium` as a CI step.

**Rationale**: The confirmed support contract intentionally excludes Node 18. The CI matrix must exercise every supported release line, and the test suite includes real browser tests (`test/browser/session.test.js`, `test/viewer-dom.test.js`) that require the Chromium binary.

### 2. Complete config validation

**Decision**: Extend `validateConfig` to check `maxRetries`, `maxRedirects`, `retryDelayMs`, and `jitterMaxMs`.

**Rationale**: `src/downloader.js` reads these values. Invalid values currently produce confusing runtime behavior (negative retries, infinite redirect loops, etc.).

### 3. Make config immutable

**Decision**: Export a `loadConfig(overrides)` factory that returns a frozen config object. `bin/backup.js` will use this factory instead of mutating a shared live object.

**Rationale**: Prevents accidental cross-module mutation and makes tests deterministic. Backwards compatibility is preserved by still exporting `defaults`, `validateConfig`, and `ConfigError`.

### 4. Friendly CLI error output

**Decision**: In `bin/backup.js`, catch `ConfigError` and print a single clear line before exiting with code 1.

**Rationale**: A full stack trace for a bad config value is intimidating and unhelpful.

## Module Interfaces

### `src/config.js`

```js
const defaults = { /* ... */ };

class ConfigError extends Error {}

function validateConfig(config) {}

function loadConfig(overrides = {}) {}

module.exports = {
  loadConfig,
  validateConfig,
  defaults,
  ConfigError,
};
```

### `bin/backup.js`

```js
const config = applyOverrides(loadConfig(), args);

try {
  validateConfig(config);
} catch (e) {
  if (e instanceof ConfigError) {
    console.error(`Error: ${e.message}`);
    process.exit(1);
  }
  throw e;
}
```

## Testing Strategy

- Unit tests for `validateConfig` covering all tunables.
- CLI test asserting friendly config error output.
- Package engine and CI matrix inspection against the supported Node.js baseline.
- CI workflow inspection for Chromium installation and step ordering.
