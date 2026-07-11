# Tasks: CI and Config Hardening

## Change

`ci-config-hardening`

## Review Workload Forecast

| Field | Value |
|---|---|
| Estimated changed lines | ~120–180 |
| 400-line budget risk | Low |
| Chained PRs recommended | No |
| Suggested split | Single PR |
| Delivery strategy | single-pr (cached) |

Decision needed before apply: No

---

## Phase 1: Config Validation

- [ ] 1.1 RED: Write tests for `maxRetries`, `maxRedirects`, `retryDelayMs`, `jitterMaxMs` validation.
- [ ] 1.2 GREEN: Extend `validateConfig` in `src/config.js` to validate the new tunables.
- [ ] 1.3 REFACTOR: Verify all existing config tests still pass.

## Phase 2: Config Immutability

- [ ] 2.1 RED: Write a test asserting `loadConfig()` returns a frozen object.
- [ ] 2.2 GREEN: Add `loadConfig(overrides)` factory to `src/config.js` that returns `Object.freeze({ ...defaults, ...overrides })`.
- [ ] 2.3 REFACTOR: Update `bin/backup.js` to use `loadConfig()` and `applyOverrides` on the returned object.
- [ ] 2.4 REFACTOR: Update any tests that mutate the exported config to use `loadConfig` instead.

## Phase 3: Friendly CLI Errors

- [ ] 3.1 RED: Write a test asserting `bin/backup.js` prints a friendly error for an invalid config value.
- [ ] 3.2 GREEN: Add try/catch around `validateConfig` in `bin/backup.js` to print `Error: <message>` and exit 1.
- [ ] 3.3 REFACTOR: Verify non-ConfigError exceptions still show full error details.

## Phase 4: CI Hardening

- [ ] 4.1 GREEN: Add `npx playwright install chromium` to `.github/workflows/ci.yml`.
- [ ] 4.2 REFACTOR: Ensure CI step ordering is correct: checkout → setup-node → npm ci → install browser → lint → format:check → test.
- [ ] 4.3 RED: Document the CI change in the SDD artifacts.

## Phase 5: Verification

- [ ] 5.1 Run `npm test` and confirm all tests pass.
- [ ] 5.2 Run `npm run lint` and `npm run format:check`.
- [ ] 5.3 Run `node bin/backup.js --output ''` and verify friendly error.
- [ ] 5.4 Run `node bin/backup.js --help` and `node bin/backup.js --version`.
- [ ] 5.5 Review the diff against the spec and design.

## Phase 6: Archive

- [ ] 6.1 Archive the change with `sdd-archive`.
