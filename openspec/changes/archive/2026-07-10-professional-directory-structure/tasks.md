# Tasks: Professional Directory Structure

## Review Workload Forecast

| Field | Value |
|---|---|
| Estimated changed lines | ~500–700 (within 800-line project budget) |
| 400-line budget risk | Medium |
| Chained PRs recommended | No |
| Suggested split | Single PR |
| Delivery strategy | single-pr |
| Chain strategy | pending |

Decision needed before apply: No
Chained PRs recommended: No
Chain strategy: pending
400-line budget risk: Medium

### Suggested Work Units

| Unit | Goal | Likely PR | Focused test command | Runtime harness | Rollback boundary |
|---|---|---|---|---|---|
| 1 | Cleanup, restructure, configs, and docs | PR 1 | `npm test` | `node bin/backup.js --help` and `node bin/regen-html.js --help` | Revert file moves and path updates; re-run `npm install` if needed |

Every production task is preceded by a RED test task and followed by a REFACTOR verification task.

## Phase 1: Cleanup Stale Artifacts

- [x] 1.1 RED: Write `test/cleanup.test.js` asserting `*_output.txt`, `logo.png`, `.codegraph/`, `.atl/`, `node_modules/`, and `openspec/changes/post-hardening-improvements/` are removed, and `backups/`/`browser-profile/` remain.
- [x] 1.2 GREEN: Delete the listed stale files and directories.
- [x] 1.3 REFACTOR: Verify root inventory matches spec.

## Phase 2: Restructure Directories

- [x] 2.1 RED: Write `test/layout.test.js` asserting `bin/backup.js`, `bin/regen-html.js`, `src/config.js`, `src/utils.js`, `src/downloader.js`, `src/cancel-token.js`, `src/templates/viewer.html`, and `test/helpers/run-interrupt.js` exist and root copies are gone.
- [x] 2.2 GREEN: Move `backup.js`/`regen-html.js` to `bin/`, library modules to `src/`, `templates/viewer.html` to `src/templates/`, and `scripts/run-interrupt.js` to `test/helpers/`.
- [x] 2.3 REFACTOR: Remove empty `templates/` and `scripts/` directories.

## Phase 3: Update Internal Paths

- [x] 3.1 RED: Write tests asserting `src/config.js` defaults resolve to project root, `src/utils.js` loads `src/templates/viewer.html`, and all internal `require()` paths resolve.
- [x] 3.2 GREEN: Update `require()` paths in `bin/backup.js`, `bin/regen-html.js`, `src/downloader.js`, and `test/helpers/run-interrupt.js`.
- [x] 3.3 GREEN: Update `src/config.js` defaults to `path.join(__dirname, "..", "backups")` and `path.join(__dirname, "..", "browser-profile")`.
- [x] 3.4 GREEN: Update `src/utils.js` template path to `path.join(__dirname, "templates", "viewer.html")`.
- [x] 3.5 GREEN: Update `test/*.test.js` imports from `../module.js` to `../src/module.js` or `../bin/module.js`.
- [x] 3.6 REFACTOR: Run `npm test` and fix any import errors.

## Phase 4: Update Tooling Configs

- [x] 4.1 RED: Write tests asserting `package.json` scripts/main/bin point to `bin/`, `.eslintrc.json` covers `bin/`, `src/`, and `test/`, and `.prettierignore` does not exclude new source directories.
- [x] 4.2 GREEN: Update `package.json` `main`, `bin`, and `scripts` to `bin/backup.js`/`bin/regen-html.js`.
- [x] 4.3 GREEN: Update `.eslintrc.json` to lint `bin/`, `src/`, `test/` and ignore runtime/generated directories plus `openspec/`.
- [x] 4.4 GREEN: Update `.prettierignore` to remove `templates/`, ensure `bin/`, `src/`, `test/` are not excluded, and add `src/templates/viewer.html`.
- [x] 4.5 GREEN: Update `.github/workflows/ci.yml` to run `node bin/backup.js --help` and `node bin/regen-html.js --help` before `npm test`.
- [x] 4.6 REFACTOR: Run `npm run lint` and `npm run format:check`.

## Phase 5: Update Docs and Context

- [x] 5.1 RED: Write tests asserting `README.md`, `AGENTS.md`, and `openspec/config.yaml` use `bin/backup.js`/`bin/regen-html.js` and document `backups/`/`browser-profile/` as runtime directories.
- [x] 5.2 GREEN: Update `README.md` and `AGENTS.md` commands, structure, and runtime-directory note.
- [x] 5.3 GREEN: Update `openspec/config.yaml` context, testing, and quality sections to reflect `bin/`/`src/` layout and available tooling.
- [x] 5.4 REFACTOR: Grep for stale references to `node backup.js`, `node regen-html.js`, `./backup.js`, and `./regen-html.js` and remove them.

## Phase 6: Final Verification

- [x] 6.1 Run `npm test` and confirm all tests pass.
- [x] 6.2 Run `node bin/backup.js --help` and `node bin/regen-html.js --help`.
- [x] 6.3 Run `node bin/regen-html.js backups/tierras-fiscales` and verify no unresolved `{{...}}` placeholders.
- [x] 6.4 Verify workspace inventory matches spec and `backups/`/`browser-profile/` are intact.
