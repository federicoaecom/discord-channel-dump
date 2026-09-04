# Tasks: CI and Config Hardening

## Change

`ci-config-hardening`

## Review Workload Forecast

| Field | Value |
|---|---|
| Estimated changed lines | ~120–180 |
| Review budget | 400 changed lines |
| 400-line budget risk | Low |
| Chained PRs recommended | No |
| Suggested split | Single PR |
| Delivery strategy | auto-chain |
| Chain strategy | pending (not needed below budget) |

Decision needed before apply: No
Chained PRs recommended: No
Chain strategy: pending
400-line budget risk: Low

---

## Phase 1: Config Validation

- [x] 1.1 RED: Write tests for `maxRetries`, `maxRedirects`, `retryDelayMs`, `jitterMaxMs` validation.
- [x] 1.2 GREEN: Extend `validateConfig` in `src/config.js` to validate the new tunables.
- [x] 1.3 REFACTOR: Verify all existing config tests still pass.

## Phase 2: Config Immutability

- [x] 2.1 RED: Write a test asserting `loadConfig()` returns a frozen object.
- [x] 2.2 GREEN: Add `loadConfig(overrides)` factory to `src/config.js` that returns `Object.freeze({ ...defaults, ...overrides })`.
- [x] 2.3 REFACTOR: Update `bin/backup.js` to pass `loadConfig()` through `applyOverrides`, which returns a new frozen config object.
- [x] 2.4 REFACTOR: Update any tests that mutate the exported config to use `loadConfig` instead.

## Phase 3: Friendly CLI Errors

- [x] 3.1 RED: Write a test asserting `bin/backup.js` prints a friendly error for an invalid config value.
- [x] 3.2 GREEN: Add try/catch around `validateConfig` in `bin/backup.js` to print `Error: <message>` and exit 1.
- [x] 3.3 REFACTOR: Verify non-ConfigError exceptions still show full error details.

## Phase 4: CI Hardening

- [x] 4.1 GREEN: Set `package.json` engines to `^20.19.0 || ^22.13.0 || >=24` and CI to Node `20.x`, `22.x`, and `24.x` without Node 18.
- [x] 4.2 REFACTOR: Add Chromium installation and preserve CI order: checkout → setup-node → npm ci → install browser → lint → format:check → test.
- [x] 4.3 RED: Document the CI change in the SDD artifacts.

## Phase 5: Verification Preparation

- [x] 5.1 Prepare the `npm test` result for independent `sdd-verify` review.
- [x] 5.2 Prepare the `npm run lint` and `npm run format:check` results for independent `sdd-verify` review.
- [x] 5.3 Prepare the `node bin/backup.js --output ''` friendly-error result for independent `sdd-verify` review.
- [x] 5.4 Prepare the `node bin/backup.js --help` and `node bin/backup.js --version` results for independent `sdd-verify` review.
- [x] 5.5 Prepare the implementation-to-spec/design comparison for the verification handoff.

## Post-Verification Lifecycle

Independent `sdd-verify` has not occurred. After it passes, `sdd-archive` moves this change to the
archive and syncs its delta specifications. Archival is not an implementation task and has not occurred.
