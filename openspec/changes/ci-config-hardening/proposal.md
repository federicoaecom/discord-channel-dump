# Proposal: CI and Config Hardening

## Change

`ci-config-hardening`

## Intent

Fix the CI pipeline so it actually runs Playwright browser tests, complete the config validation that the downloader depends on, and make the global config object immutable so it cannot be accidentally corrupted at runtime.

## Scope

### In Scope
- Add Playwright browser installation step to GitHub Actions.
- Validate `maxRetries`, `maxRedirects`, `retryDelayMs`, and `jitterMaxMs` in `src/config.js`.
- Print a friendly `ConfigError` message from `bin/backup.js`.
- Freeze the exported config object and switch `bin/backup.js` to a `loadConfig(overrides)` factory.
- Add tests for the new config validation rules and CLI error output.

### Out of Scope
- Logging refactor.
- New features (`--dry-run`, `--verbose`).
- Browser/DOM selector improvements.
- npm publish preparation.

## Affected Areas

| Area | Impact |
|---|---|
| `.github/workflows/ci.yml` | Installs Chromium before tests |
| `src/config.js` | Validates all tunables; exports frozen config via `loadConfig` |
| `bin/backup.js` | Uses `loadConfig`; prints friendly config errors |
| `test/config.test.js` | New validation cases |
| `test/cli.test.js` | Friendly config error output |

## Risks

| Risk | Mitigation |
|---|---|
| Freezing config breaks a test that mutates it | Update tests to use `loadConfig` with explicit overrides |
| CI still fails on browser tests in headless Ubuntu | Add `xvfb` or run Playwright headless in CI via env var |

## Dependencies

None. No new runtime dependencies.
