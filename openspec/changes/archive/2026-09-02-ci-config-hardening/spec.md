# Spec: CI and Config Hardening

## Change

`ci-config-hardening`

## Requirements

### Requirement: Install Playwright Chromium in CI

`.github/workflows/ci.yml` MUST run `npx playwright install chromium` after `npm ci` and before `npm test`.

### Requirement: Declare supported Node.js engines

`package.json` MUST declare supported engines as `^20.19.0 || ^22.13.0 || >=24`.

### Requirement: Run CI on every supported Node.js release line

CI MUST run Node `20.x`, `22.x`, and `24.x`.

### Requirement: Exclude unsupported Node 18

Node 18 is intentionally unsupported and MUST NOT appear in the engine range or CI matrix.

#### Scenario: Supported Node.js baseline

Given the package metadata and CI workflow, when the supported runtime baseline is inspected, then the engine range is `^20.19.0 || ^22.13.0 || >=24` and the CI matrix contains `20.x`, `22.x`, and `24.x` without Node 18.

### Requirement: Reject invalid maxRetries

`validateConfig` must reject `maxRetries` if it is not a positive integer.

#### Scenario: Invalid maxRetries

Given a config with `maxRetries: 0`, when `validateConfig` is called, then it throws `ConfigError` with message mentioning `maxRetries`.

### Requirement: Reject invalid maxRedirects

`validateConfig` must reject `maxRedirects` if it is not a positive integer.

### Requirement: Reject invalid retryDelayMs

`validateConfig` must reject `retryDelayMs` if it is negative or not finite.

### Requirement: Reject invalid jitterMaxMs

`validateConfig` must reject `jitterMaxMs` if it is negative or not finite.

### Requirement: Preserve existing config validation

All existing validations for `backupDir`, `profileDir`, `apiBatchSize`, `apiDelayMs`, and `downloadTimeoutMs` must remain unchanged.

### Requirement: Return frozen loaded configuration

`loadConfig()` must return a frozen config object.

### Requirement: Apply CLI overrides without mutating defaults

`applyOverrides` in `bin/backup.js` must apply overrides before validation, without mutating the exported live `defaults` object.

### Requirement: Block loaded config mutation

Mutating the returned config object (e.g., `config.backupDir = 'x'`) must throw in strict mode or be silently ignored (frozen behavior).

#### Scenario: Config mutation blocked

Given `const config = loadConfig()`, when `config.apiBatchSize = 1` is attempted, then it fails because the object is frozen.

### Requirement: Print friendly ConfigError output

When `validateConfig` throws `ConfigError`, `bin/backup.js` must print `Error: <message>` and exit with code 1.

#### Scenario: Friendly CLI error

Given `apiBatchSize: 0` in an override, when `bin/backup.js` runs, then stdout/stderr contains `Error: apiBatchSize must be...` and the process exits with code 1.

### Requirement: Preserve non-ConfigError diagnostics

Non-`ConfigError` fatal errors must still print the full stack/message for debugging.

## Test Plan

- `test/config.test.js`: add cases for `maxRetries`, `maxRedirects`, `retryDelayMs`, `jitterMaxMs`, and frozen configuration behavior.
- `test/cli.test.js`: add a friendly `ConfigError` output case.
- Inspect `package.json` and `.github/workflows/ci.yml` for the supported Node.js baseline and CI browser installation.
