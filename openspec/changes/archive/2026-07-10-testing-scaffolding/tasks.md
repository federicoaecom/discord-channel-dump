# Tasks: Testing Scaffolding

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | ~350 |
| 400-line budget risk | Low |
| Chained PRs recommended | No |
| Suggested split | Single PR |
| Delivery strategy | single-pr |
| Chain strategy | pending |

Decision needed before apply: No
Chained PRs recommended: No
Chain strategy: pending
400-line budget risk: Low

### Suggested Work Units

| Unit | Goal | Likely PR | Focused test command | Runtime harness | Rollback boundary |
|------|------|-----------|----------------------|-----------------|-------------------|
| 1 | Testing scaffolding | PR 1 | `npm test` | `npm run lint` | Revert `package.json`, `backup.js`, `regen-html.js`; delete `test/`, `.eslintrc.json`, `.prettierrc`, `.github/workflows/ci.yml` |

## Phase 1: Test Runner

- [x] 1.1 Add `test` and `test:watch` scripts to `package.json` using `node --test`.
- [x] 1.2 Verify `npm test` exits cleanly with an empty `test/` directory.

## Phase 2: CLI Testability (RED → GREEN)

- [x] 2.1 RED: Write `test/cli.test.js` asserting `backup.js` exports `parseCliArgs` and `applyOverrides`.
- [x] 2.2 RED: Write `test/cli.test.js` asserting `regen-html.js` exports `parseCliArgs`.
- [x] 2.3 GREEN: Guard `main()` in `backup.js` with `require.main === module` and export the two helpers.
- [x] 2.4 GREEN: Guard `main()` in `regen-html.js` with `require.main === module` and export `parseCliArgs`.
- [x] 2.5 Run `npm test` to confirm CLI export tests pass.

## Phase 3: Unit Tests

- [x] 3.1 Write `test/config.test.js` for `validateConfig` valid, invalid, and missing-field cases.
- [x] 3.2 Write `test/utils.test.js` for `sanitize`, `escapeHtml`, `filenameFromUrl`, `uniqueFilename`, and `iconFor`.
- [x] 3.3 Write `test/utils.test.js` for `generateHtml` using a `templates/viewer.html` fixture and empty messages.
- [x] 3.4 Run `npm test` to confirm all unit tests pass.

## Phase 4: Quality Tooling

- [x] 4.1 Add `eslint` to `devDependencies` and create `.eslintrc.json` extending `eslint:recommended`.
- [x] 4.2 Add `prettier` to `devDependencies` and create `.prettierrc`.
- [x] 4.3 Add `lint`, `format`, and `format:check` scripts to `package.json`.
- [x] 4.4 Run `npm run lint` and `npm run format:check` to verify tooling.

## Phase 5: CI & Strict TDD

- [x] 5.1 Create `.github/workflows/ci.yml` running lint, format check, and tests on Node 18+.
- [x] 5.2 Update `openspec/config.yaml` to set `strict_tdd: true` and mark testing/quality tools available.

## Phase 6: Verification

- [x] 6.1 Run `npm test`, `npm run lint`, and `npm run format:check` successfully.
- [x] 6.2 Verify `node backup.js --help` and `node regen-html.js --help` still exit cleanly.
