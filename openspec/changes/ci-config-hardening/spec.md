# Spec: CI and Config Hardening

## Change

`ci-config-hardening`

## Requirements

### R1 — CI installs Playwright Chromium

**R1.1** `.github/workflows/ci.yml` must run `npx playwright install chromium` after `npm ci` and before `npm test`.

**R1.2** CI must run the same Node versions as today (18.x, 20.x).

### R2 — All config tunables are validated

**R2.1** `validateConfig` must reject `maxRetries` if it is not a positive integer.

**R2.2** `validateConfig` must reject `maxRedirects` if it is not a positive integer.

**R2.3** `validateConfig` must reject `retryDelayMs` if it is negative or not finite.

**R2.4** `validateConfig` must reject `jitterMaxMs` if it is negative or not finite.

**R2.5** All existing validations for `backupDir`, `profileDir`, `apiBatchSize`, `apiDelayMs`, and `downloadTimeoutMs` must remain unchanged.

### R3 — Config is immutable at runtime

**R3.1** `loadConfig()` must return a frozen config object.

**R3.2** `applyOverrides` in `bin/backup.js` must apply overrides before validation, without mutating the exported live `defaults` object.

**R3.3** Mutating the returned config object (e.g., `config.backupDir = 'x'`) must throw in strict mode or be silently ignored (frozen behavior).

### R4 — Friendly CLI error output

**R4.1** When `validateConfig` throws `ConfigError`, `bin/backup.js` must print `Error: <message>` and exit with code 1.

**R4.2** Non-`ConfigError` fatal errors must still print the full stack/message for debugging.

## Scenarios

### S1 — Invalid `maxRetries`

Given a config with `maxRetries: 0`, when `validateConfig` is called, then it throws `ConfigError` with message mentioning `maxRetries`.

### S2 — Config mutation blocked

Given `const config = loadConfig()`, when `config.apiBatchSize = 1` is attempted, then it fails because the object is frozen.

### S3 — Friendly CLI error

Given `apiBatchSize: 0` in an override, when `bin/backup.js` runs, then stdout/stderr contains `Error: apiBatchSize must be...` and the process exits with code 1.

## Test Plan

- `test/config.test.js`: add cases for R2.1–R2.4 and R3.
- `test/cli.test.js`: add case for R4.
- Manual inspection of `.github/workflows/ci.yml` for R1.
