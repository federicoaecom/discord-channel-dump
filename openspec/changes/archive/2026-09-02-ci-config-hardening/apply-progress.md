# Apply Progress: CI and Config Hardening

## Status

- Change: `ci-config-hardening`
- Mode: Strict TDD
- Delivery: Single autonomous work unit; low review-risk forecast.
- Task state: 18/18 implementation and verification-preparation tasks complete.
- Lifecycle state: Awaiting independent `sdd-verify`; archive has not occurred.
- Corrective revision: This artifact remedies the prior missing initial-apply evidence file.

## Evidence Provenance

The workspace already contained several target behaviors before the first apply attempt. Those
behaviors are adopted as pre-existing requirement evidence and are not represented as fabricated
RED cycles. Only behavior changed during the first apply attempt has a genuine observed
RED -> GREEN -> REFACTOR record below.

### Adopted Pre-Existing Requirement Evidence

| Requirement area | Existing evidence adopted | Validation performed in this apply |
|---|---|---|
| Config validation | `src/config.js` already validated `maxRetries`, `maxRedirects`, `retryDelayMs`, and `jitterMaxMs`; existing tests covered baseline invalid values. | Added non-integer/non-finite cases; `node --test test/config.test.js` passed 21/21. |
| Config factory | `loadConfig(overrides)` already returned a frozen copy without mutating defaults. | Existing and focused config tests passed. |
| Friendly config errors | `bin/backup.js` already handled `ConfigError` with `Error: <message>` and an exit code of 1. | Existing CLI subprocess test passed within `node --test test/cli.test.js` (17/17). |
| Playwright CI setup | `.github/workflows/ci.yml` already installed Chromium after `npm ci` and before lint, format, and test. | Ordering inspection returned `CI_ORDER_OK`. |

## TDD Cycle Evidence

| Tasks | Test file/layer | Safety net | RED | GREEN | TRIANGULATE | REFACTOR |
|---|---|---|---|---|---|---|
| 1.1–1.3 | `test/config.test.js` / Unit | `npm test` baseline: 189/189 | Pre-existing implementation: no historical RED claimed. | Added coverage passed: 21/21. | Added distinct non-integer and non-finite invalid inputs. | No production refactor required. |
| 2.1–2.2 | `test/config.test.js` / Unit | Baseline: 189/189 | Pre-existing factory/test: no historical RED claimed. | Focused config suite: 21/21. | Existing defaults and override cases exercise distinct paths. | No production refactor required. |
| 2.3 | `test/cli.test.js` / Unit | Baseline: 189/189 | `Object.isFrozen(applyOverrides(...))` failed. | `applyOverrides` now freezes its merged runtime config; CLI suite: 17/17. | Override paths and no-mutation factory behavior both covered. | Kept the pure merge helper. |
| 2.4 | `test/config.test.js` / Unit | Baseline: 189/189 | No mutating test required; no mutating tests existed to migrate. | Focused config suite: 21/21. | N/A — structural task. | None needed. |
| 3.1–3.2 | `test/cli.test.js` / Integration | Baseline: 189/189 | Pre-existing friendly-error test: no historical RED claimed. | CLI suite: 17/17. | Existing subprocess test verifies exit code and friendly output. | No production refactor required. |
| 3.3 | `test/cli.test.js` / Unit | Baseline: 189/189 | Missing `handleFatalError` export and stack output failed. | Extracted handler prints `error.stack || error.message`; CLI suite: 17/17. | Covered stack and message-only errors. | Reused handler from the top-level rejection path. |
| 4.1–4.3 | Workflow inspection / Static | Baseline: 189/189 | Pre-existing workflow/artifact documentation: no historical RED claimed. | `CI_ORDER_OK`. | N/A — workflow structure. | None needed. |
| 5.1–5.5 | Full suite and CLI / Integration | N/A | N/A — verification-preparation tasks. | `npm test`: 195/195; lint and format passed. | Help, version, and invalid option paths executed. | Diff reviewed; no further change required. |

## Work Unit Evidence

| Evidence | Exact result |
|---|---|
| Focused config test | `node --test test/config.test.js` — exit 0; 21 tests passed, 0 failed. |
| Focused CLI test | `node --test test/cli.test.js` — exit 0; 17 tests passed, 0 failed. |
| Full test suite | `npm test` — exit 0; 195 tests passed, 0 failed. |
| Lint | `npm run lint` — exit 0. |
| Formatting | `npm run format:check` — exit 0 after formatting the new CLI assertion. |
| Runtime CLI scenario | `node bin/backup.js --output ''` under PowerShell — exit 1; emitted the friendly parser message `Error: Missing value for --output`. |
| Help and version | `node bin/backup.js --help` — exit 0; `node bin/backup.js --version` — exit 0, output `1.0.0`. |
| CI ordering | Bounded workflow ordering inspection — exit 0; `CI_ORDER_OK`. |
| Rollback boundary | Revert the `bin/backup.js`, `test/cli.test.js`, and `test/config.test.js` changes for this work unit; retain unrelated accumulated P1/P2 changes and all untracked selections. |

## Deviations and Constraints

- The former `18.x`/`20.x` matrix was a stale, superseded planning requirement, not an active or
  authoritative support contract. The adopted and currently verified CI matrix is `20.x`, `22.x`,
  and `24.x`, and supported engines are `^20.19.0 || ^22.13.0 || >=24`.
- PowerShell does not pass `''` to the native Node command as an empty argument. The command
  still proves a friendly error and non-zero exit, while the dedicated CLI subprocess test
  proves the `ConfigError` branch.
- Archive remains intentionally pending after independent verification and is not a task checkbox.
