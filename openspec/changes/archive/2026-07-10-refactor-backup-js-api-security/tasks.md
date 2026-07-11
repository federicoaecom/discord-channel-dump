# Tasks: Refactor `bin/backup.js` and Move Discord API Calls to Node Context

## Change

`refactor-backup-js-api-security`

## Review Workload Forecast

| Field | Value |
|---|---|
| Estimated changed lines | ~700–950 |
| 400-line budget risk | High |
| Chained PRs recommended | Yes (optional) |
| Suggested split | Single PR with size exception, or two chained PRs: (1) extraction of modules, (2) API Node-context migration + tests |
| Delivery strategy | single-pr (cached) |
| Chain strategy | pending |

Decision needed before apply: Yes  
400-line budget risk: High  
Chained PRs recommended: Yes

### Suggested Work Units

| Unit | Goal | Focused test command | Runtime harness | Rollback boundary |
|---|---|---|---|---|
| 1 | Extract CLI args, prompts, normalization, output writer | `npm test` | `node bin/backup.js --help` | Revert to old `bin/backup.js` |
| 2 | Extract browser session and create Node-context API module | `npm test` | Token capture still works | Restore old `page.evaluate` API calls |
| 3 | Create `src/app.js`, thin `bin/backup.js`, update tests | `npm test` | Full interactive smoke | Restore old `bin/backup.js` |

Every production task is preceded by a RED test task and followed by a REFACTOR verification task.

---

## Phase 1: Extract Non-Browser Modules

- [x] 1.1 RED: Write tests for `src/cli/backup-args.js` parsing, help, and version.
- [x] 1.2 GREEN: Create `src/cli/backup-args.js` with `parseCliArgs`, `printHelp`, `printVersion`.
- [x] 1.3 REFACTOR: Update `cli.test.js` to import from the new module.
- [x] 1.4 RED: Write tests for `src/ui/prompt.js` (mock readline).
- [x] 1.5 GREEN: Create `src/ui/prompt.js` with `createPrompt()`.
- [x] 1.6 REFACTOR: Ensure `prompt` can be closed and reused across the loop.
- [x] 1.7 RED: Write tests for `src/messages/normalize.js` with sample API payloads.
- [x] 1.8 GREEN: Create `src/messages/normalize.js` with `normalizeMessage`.
- [x] 1.9 REFACTOR: Verify image, attachment, and embed handling is preserved.
- [x] 1.10 RED: Write tests for `src/output/writer.js` (temp dirs, file existence, skip logic).
- [x] 1.11 GREEN: Create `src/output/writer.js` with `saveChannel`.
- [x] 1.12 REFACTOR: Move download orchestration logic into `saveChannel`.

---

## Phase 2: Extract Browser and API Modules

- [x] 2.1 RED: Write tests for `src/browser/session.js` (token capture, channel ID detection).
- [x] 2.2 GREEN: Create `src/browser/session.js` with `launchBrowser`, `getChannelId`, `getChannelNameFromDom`.
- [x] 2.3 REFACTOR: Ensure `_context` is exposed for the shutdown handler.
- [x] 2.4 RED: Write tests for `src/api/discord.js` using a local HTTP fixture server.
- [x] 2.5 GREEN: Create `src/api/discord.js` with `getChannelName` and `fetchAllMessages` using Node request context.
- [x] 2.6 REFACTOR: Verify rate limit handling and pagination match existing behavior.
- [x] 2.7 GREEN: Remove all `page.evaluate()` API calls from `bin/backup.js`.

---

## Phase 3: Create App Module and Thin Entry Point

- [x] 3.1 RED: Write tests for `src/app.js` with stubbed dependencies.
- [x] 3.2 GREEN: Create `src/app.js` with `runBrowserSession`.
- [x] 3.3 REFACTOR: Move `sharedCancelToken` creation and shutdown wiring to `bin/backup.js` and `app.js`.
- [x] 3.4 GREEN: Replace `bin/backup.js` body with a thin wrapper that loads config, parses args, and calls `src/app.js`.
- [x] 3.5 REFACTOR: Remove dead code from `bin/backup.js` and ensure it is under 150 lines.
- [x] 3.6 REFACTOR: Move `processChannel` exports to `src/output/writer.js` or remove public exports if no longer needed.

---

## Phase 4: Verification

- [x] 4.1 Run `npm test` and confirm all tests pass.
- [x] 4.2 Run `node bin/backup.js --help` and `node bin/backup.js --version`.
- [x] 4.3 Run `node bin/regen-html.js --help` to ensure no regressions.
- [x] 4.4 Run `npm run lint` and `npm run format:check`.
- [x] 4.5 Verify `bin/backup.js` is under 150 lines.
- [x] 4.6 Grep for `page.evaluate` and confirm no API calls remain.
- [x] 4.7 Update `AGENTS.md` file structure if needed.
- [x] 4.8 Update `NEXT-REFACTOR.md` to mark completed items or archive it.

---

## Phase 5: Review and Archive

- [x] 5.1 Review the diff against the design and specs.
- [x] 5.2 Run a final smoke test of the interactive flow if possible (manual check).
- [x] 5.3 Apply review feedback.
- [x] 5.4 Archive the change with `sdd-archive`.

---

## Notes

- This change will touch many files. The review budget is 800 lines; a size exception may be needed.
- If the user prefers chained PRs, split after Phase 2 and after Phase 3.
- Strict TDD is active; every GREEN task must be preceded by a RED task.
