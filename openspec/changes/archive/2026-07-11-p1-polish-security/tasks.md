# Tasks: P1 Polish and Security Improvements

## Change

`p1-polish-security`

## Review Workload Forecast

| Field | Value |
|---|---|
| Estimated changed lines | ~500–700 |
| 400-line budget risk | Medium |
| Chained PRs recommended | No |
| Suggested split | Single PR with size exception |
| Delivery strategy | single-pr (cached) |
| Chain strategy | pending |

Decision needed before apply: No  
400-line budget risk: Medium  
Chained PRs recommended: No

### Suggested Work Units

| Unit | Goal | Focused test command | Runtime harness | Rollback boundary |
|---|---|---|---|---|
| 1 | Split `src/utils.js` into focused modules | `npm test` | `node bin/backup.js --help` | Restore old `src/utils.js` |
| 2 | Add CSP and safe links to viewer | `npm test` | Load viewer in Playwright | Revert `src/templates/viewer.html` |
| 3 | Add terminal colors and progress bar | `npm test` | Run a small download test | Revert `src/output/writer.js` and `src/app.js` changes |

Every production task is preceded by a RED test task and followed by a REFACTOR verification task.

---

## Phase 1: Split `src/utils.js`

- [x] 1.1 RED: Write tests for `src/utils/sanitize.js`.
- [x] 1.2 GREEN: Create `src/utils/sanitize.js` with `sanitize`.
- [x] 1.3 REFACTOR: Verify existing `sanitize` behavior is preserved.
- [x] 1.4 RED: Write tests for `src/utils/html.js`.
- [x] 1.5 GREEN: Create `src/utils/html.js` with `escapeHtml`.
- [x] 1.6 REFACTOR: Verify existing `escapeHtml` behavior is preserved.
- [x] 1.7 RED: Write tests for `src/utils/filenames.js`.
- [x] 1.8 GREEN: Create `src/utils/filenames.js` with `filenameFromUrl` and `uniqueFilename`.
- [x] 1.9 REFACTOR: Verify existing filename behavior is preserved.
- [x] 1.10 RED: Write tests for `src/utils/icons.js`.
- [x] 1.11 GREEN: Create `src/utils/icons.js` with `iconFor`.
- [x] 1.12 REFACTOR: Verify existing icon behavior is preserved.
- [x] 1.13 RED: Write tests for `src/viewer/render.js`.
- [x] 1.14 GREEN: Create `src/viewer/render.js` with `generateHtml`.
- [x] 1.15 REFACTOR: Move template reading and HTML generation from `src/utils.js`.
- [x] 1.16 GREEN: Convert `src/utils.js` to a backwards-compatible barrel.
- [x] 1.17 REFACTOR: Run full test suite and update imports where needed.
- [x] 1.18 ADAPT: Extract `ensureDir` into `src/utils/fs.js` and update `src/app.js`, `src/browser/session.js`, and `src/output/writer.js` to import it directly. Include `src/utils/fs.test.js` in the test script.

---

## Phase 2: Harden Viewer

- [x] 2.1 RED: Write a test asserting `src/templates/viewer.html` contains a CSP meta tag with required directives.
- [x] 2.2 GREEN: Add the CSP meta tag to the template.
- [x] 2.3 REFACTOR: Verify the inline script still works with the new CSP.
- [x] 2.4 RED: Write a test asserting all `target="_blank"` links have `rel="noopener noreferrer"`.
- [x] 2.5 GREEN: Add `rel="noopener noreferrer"` to image and attachment links in `generateHtml`.
- [x] 2.6 REFACTOR: Verify viewer DOM tests still pass.

---

## Phase 3: Improve Terminal UX

- [x] 3.1 RED: Write tests for `src/ui/colors.js` (TTY and non-TTY modes).
- [x] 3.2 GREEN: Create `src/ui/colors.js` with ANSI helpers.
- [x] 3.3 REFACTOR: Verify color output is disabled when not a TTY.
- [x] 3.4 RED: Write tests for `src/ui/progress.js` (bar, bytes, ETA).
- [x] 3.5 GREEN: Create `src/ui/progress.js` with progress helpers.
- [x] 3.6 REFACTOR: Verify edge cases (0%, 100%, unknown total bytes).
- [x] 3.7 GREEN: Update `src/app.js` to use colored status/warning messages.
- [x] 3.8 REFACTOR: Update `test/app.test.js` to assert colored output where appropriate (covered by `test/ui/colors.test.js` and existing app behavior tests).
- [x] 3.9 GREEN: Update `src/output/writer.js` to render a progress bar during downloads; inject `downloadFileFn` for testability.
- [x] 3.10 REFACTOR: Verify progress bar output and skip logic still work.

---

## Phase 4: Verification

- [x] 4.1 Run `npm test` and confirm all tests pass.
- [x] 4.2 Run `node bin/backup.js --help` and `node bin/backup.js --version`.
- [x] 4.3 Run `node bin/regen-html.js --help`.
- [x] 4.4 Run `npm run lint` and `npm run format:check`.
- [x] 4.5 Verify `src/utils.js` is a barrel with no internal logic.
- [x] 4.6 Verify generated HTML contains CSP and safe links.
- [x] 4.7 Update `AGENTS.md` to reflect the new module layout.

---

## Phase 5: Review and Archive

- [x] 5.1 Review the diff against the design and specs.
- [x] 5.2 Apply any review feedback.
- [x] 5.3 Archive the change with `sdd-archive`.
