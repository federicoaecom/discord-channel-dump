# Archive Report: Refactor `bin/backup.js` and Move Discord API Calls to Node Context

**Archived**: 2026-07-10  
**Change**: `refactor-backup-js-api-security`  
**Delivery**: Single PR with maintainer-approved size exception

## Outcome

**Verdict**: **PASS**

- `bin/backup.js` reduced from 578 lines to 60 lines.
- Discord API calls moved from `page.evaluate()` to `context.request()` in `src/api/discord.js`.
- Authorization token no longer leaves the Node process context.
- 113 tests pass, lint and format clean.

## Delivered Scope

- New modules:
  - `src/cli/backup-args.js`
  - `src/ui/prompt.js`
  - `src/messages/normalize.js`
  - `src/output/writer.js`
  - `src/browser/session.js`
  - `src/api/discord.js`
  - `src/app.js`
- Thinned `bin/backup.js` to CLI-only wrapper.
- Updated `package.json` test script to include new test files.
- Updated `AGENTS.md` with the new file structure.
- Moved temporary `NEXT-REFACTOR.md` into the change folder and marked it implemented.

## Specs

Canonical specs remain in `openspec/specs/`:

- `refactor-cli-entry/`
- `browser-session-abstraction/`
- `discord-api-node/`
- `output-writer/`

## Build & Test Summary

| Check | Result |
|---|---|
| `npm test` | 113/113 pass |
| `npm run lint` | Clean |
| `npm run format:check` | Clean |
| `node bin/backup.js --help` | Works |
| `node bin/backup.js --version` | Works |
| `node bin/regen-html.js --help` | Works |

## Security Improvement

Before: token was passed into `page.evaluate()` to call Discord API from the browser context.  
After: token is captured from outgoing requests and used only by Node-side `context.request()`.

This closes the risk of the token being exposed to the Discord front-end JavaScript context.

## Notes

- The change touched many files; a size exception was approved by the user.
- No new runtime dependencies were added.
- The interactive CLI behavior is unchanged for users.
