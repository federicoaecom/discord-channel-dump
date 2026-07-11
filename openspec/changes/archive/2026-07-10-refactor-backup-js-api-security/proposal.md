# Proposal: Refactor `bin/backup.js` and Move Discord API Calls to Node Context

## Change

`refactor-backup-js-api-security`

## Intent

Reduce the surface area of `bin/backup.js` so it becomes a thin CLI wrapper, move every Discord API call into a testable Node.js module, and ensure the user's authorization token never leaves the Node process context.

## Problem Statement

`bin/backup.js` currently mixes five concerns in one 578-line file:

1. CLI argument parsing and help/version output.
2. Browser launch and session management.
3. Discord API message fetching.
4. Media download orchestration.
5. Interactive terminal prompts and the main loop.

This makes the file hard to test, hard to reason about, and risky to change. The most serious issue is that Discord API calls are executed inside the browser page context via `page.evaluate()`, which means the authorization token is passed back into the page. If the page context is compromised, the token could be leaked.

## Current State

- Token is captured by listening to outgoing browser requests.
- Token is then passed into `page.evaluate()` to call Discord's REST API.
- All API logic, message normalization, and download orchestration live in `bin/backup.js`.
- `processChannel` is exported from `bin/backup.js` only for testing.
- 72 tests pass, but most are unit tests for small utilities; the orchestration layer is only covered by smoke tests.

## Desired State

- `bin/backup.js` is a thin CLI entry point (under 150 lines).
- Discord API calls live in `src/api/discord.js` and use Playwright's Node-side `request` context.
- Browser launch and token capture live in `src/browser/session.js`.
- Message normalization lives in `src/messages/normalize.js`.
- Channel output writing lives in `src/output/writer.js`.
- Terminal prompts live in `src/ui/prompt.js`.
- The interactive orchestration lives in `src/app.js`.
- The token is only used from the Node process context; it is never passed into the page.

## Scope

**In scope:**

- Extract CLI parsing from `bin/backup.js` into `src/cli/backup-args.js`.
- Extract terminal prompts into `src/ui/prompt.js`.
- Extract message normalization into `src/messages/normalize.js`.
- Extract browser launch and token capture into `src/browser/session.js`.
- Create `src/api/discord.js` with Node-context API calls.
- Create `src/output/writer.js` for writing `messages.json` and `index.html`.
- Create `src/app.js` with the interactive capture loop.
- Thin down `bin/backup.js` to a CLI wrapper.
- Update and add tests to cover the new modules.
- Update `AGENTS.md` if the file structure changes.
- Update `README.md` if commands or conventions change (not expected).

**Out of scope:**

- Changing the user-facing CLI behavior or flags.
- Adding new features to the viewer HTML.
- Changing the downloader logic (it stays in `src/downloader.js`).
- Changing config tunables or validation.
- UI/UX improvements beyond the structural refactor (e.g., colors, progress bars).
- Moving `regen-html.js` to the new structure (can be done later, but not required here).

## Non-Goals

- This change does not make the backup faster or download more files.
- It does not add new runtime dependencies.
- It does not introduce TypeScript or a new test framework.

## Business Rules / Constraints

- All existing CLI flags (`--help`, `--version`, `--output`, `--profile`) must keep the same behavior.
- The interactive flow must remain identical: log in, navigate, press ENTER, confirm name, wait for download, repeat.
- `backups/` and `browser-profile/` remain preserved runtime directories.
- No new runtime dependencies (only dev dependencies for tooling, if needed, but none are expected).
- The change must pass the existing 72 tests plus new tests for the extracted modules.
- Strict TDD is active; every production change must be preceded by a failing test.

## Affected Areas

| Area | Impact |
|---|---|
| `bin/backup.js` | Becomes a thin wrapper; most logic moved out. |
| `src/api/discord.js` | New module; all Discord API calls. |
| `src/browser/session.js` | New module; browser launch, token capture, DOM helpers. |
| `src/messages/normalize.js` | New module; message normalization. |
| `src/output/writer.js` | New module; writes `messages.json` and `index.html`. |
| `src/ui/prompt.js` | New module; readline prompts. |
| `src/app.js` | New module; interactive orchestration. |
| `src/cli/backup-args.js` | New module; CLI parsing and help/version. |
| `test/` | New tests for modules, existing tests updated. |
| `README.md` | Minor updates if needed. |
| `AGENTS.md` | Update file structure diagram if needed. |

## Risk

| Risk | Severity | Mitigation |
|---|---|---|
| Token capture or API request behavior changes. | High | Keep token capture listener unchanged; test API module with fixture server. |
| Refactor breaks interactive flow. | Medium | Keep smoke tests and add an integration test for the loop. |
| File moves break imports. | Medium | Update all `require()` paths incrementally and run tests after each move. |
| Large diff exceeds review budget. | Medium | Split into work units; may need a size exception. |
| Playwright `request` API behaves differently from browser `fetch`. | Low | Use `context.request` and verify with existing tests. |

## Rollback Plan

- Each work unit is committed independently.
- If any unit fails verification, revert that unit and keep the previous units.
- The final fallback is to restore the original `bin/backup.js` from the previous archived SDD change.

## Success Criteria

- `bin/backup.js` is under 150 lines.
- No `page.evaluate()` calls that make network requests with the token.
- Token is only used from the Node process context.
- All existing tests pass.
- New tests cover `src/api/discord.js`, `src/browser/session.js`, and `src/output/writer.js`.
- Lint and format are clean.
- CLI behavior is unchanged for users.
