# Proposal: Professional Directory Structure

## Intent

The project root is cluttered with source modules, CLI entries, templates, and generated artifacts. This makes onboarding harder and obscures the boundary between authored code, runtime data, and tooling output. This change reorganizes the project into an idiomatic Node.js CLI layout, removes stale/generated files, and updates all references.

## Scope

### In Scope
- Move `backup.js` and `regen-html.js` to `bin/`.
- Move `config.js`, `utils.js`, `downloader.js`, `cancel-token.js` to `src/`.
- Move `templates/viewer.html` to `src/templates/`.
- Move `scripts/run-interrupt.js` into `test/helpers/`.
- Update `require()` paths, `__dirname`-based defaults, and `package.json` scripts/`bin`/`main`.
- Update `.eslintrc.json`, `.prettierignore`, and docs.
- Delete stale output files (`*_output.txt`), `logo.png`, and local/generated directories (`node_modules/`, `.codegraph/`, `.atl/`).
- Archive or delete `openspec/changes/post-hardening-improvements/`.

### Out of Scope
- No functional changes to backup logic, viewer, or CLI behavior.
- No new runtime dependencies or configuration options.
- No test rewrites beyond path updates.

## Capabilities

### New Capabilities
- `cleanup-stale-artifacts`: remove stale output files, unused assets, and generated directories from the workspace.
- `restructure-cli`: move CLI entries to `bin/`, library modules to `src/`, templates to `src/templates/`, and test helpers to `test/helpers/`.
- `update-tooling-configs`: adjust `package.json`, ESLint, and Prettier for the new layout.
- `update-docs-context`: refresh `README.md`, `AGENTS.md`, and `openspec/config.yaml` to reflect the current stack and new paths.

### Modified Capabilities
- `package-metadata`: update `bin`/`main` paths and npm scripts.
- `quality-tooling`: include new directories in lint/format scope.
- `agent-onboarding`: update file structure and stack description.
- `structural-quality`: update template path expectations.
- `cross-platform-cli`: update documented command paths.

## Approach

Adopt the standard Node.js CLI layout: `bin/` for executables, `src/` for libraries, `src/templates/` for the viewer template, and `test/helpers/` for shared test fixtures. Adjust `config.js` defaults to `path.join(__dirname, "..", "backups")` and `src/utils.js` to load the template from the new relative path. Update every `require()` and npm script in one pass. Because strict TDD is active, every implementation task must show RED → GREEN → REFACTOR evidence.

## Open Question

Before cleanup, decide how to handle `backups/` (~266 MB of user-generated Discord channel data) and `browser-profile/` (~50 MB of persistent session data):

1. **Delete** — both are generated/local and listed in `.gitignore`.
2. **Move to a safe backup location** before cleanup.
3. **Keep in place** and document them as runtime directories, without moving or deleting.

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `bin/backup.js`, `bin/regen-html.js` | New | CLI entry points moved from root. |
| `src/config.js`, `src/utils.js`, `src/downloader.js`, `src/cancel-token.js` | New | Library modules moved from root. |
| `src/templates/viewer.html` | New | Template moved from `templates/`. |
| `test/helpers/run-interrupt.js` | New | Helper moved from `scripts/`. |
| `package.json` | Modified | `main`, `bin`, and scripts point to new paths. |
| `.eslintrc.json`, `.prettierignore` | Modified | Include new directories, remove stale ignores. |
| `README.md`, `AGENTS.md`, `openspec/config.yaml` | Modified | Commands and structure updated. |
| `*_output.txt`, `logo.png`, `backups/`, `browser-profile/`, `node_modules/`, `.codegraph/`, `.atl/` | Removed | Stale or generated artifacts cleaned. |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Path defaults break after moving `config.js` | High | Update defaults to `path.join(__dirname, "..", ...)`. |
| `require()` paths missed in tests or docs | Med | Run `npm test`, `npm run lint`, and grep for old references. |
| `backups/` or `browser-profile/` deleted unintentionally | Med | Resolve open question before apply; otherwise leave in place. |
| Large move-only diff complicates review | Med | Treat as rename; keep logic changes separate. |

## Rollback Plan

Restore the previous layout from the git commit before this change (or manually move files back to root and revert `package.json`/docs). If user data was moved, copy it back. Re-run `npm install` and `npm test` to verify.

## Dependencies

- Node.js 18+ and npm.
- `npx playwright install chromium` after `node_modules/` is removed.
- Possible `codegraph init` after `.codegraph/` is removed.

## Success Criteria

- [ ] `tree` shows only `bin/`, `src/`, `test/`, config/docs, and `openspec/` at root; no stale output or generated directories.
- [ ] `npm test`, `npm run lint`, and `npm run format:check` pass after path updates.
- [ ] `node bin/backup.js --help` and `node bin/regen-html.js --help` print correctly.
- [ ] `README.md` and `AGENTS.md` use the new command paths and file structure.
- [ ] `openspec/config.yaml` reflects the current stack, testing, and linting setup.
- [ ] Every task shows RED → GREEN → REFACTOR evidence under strict TDD.
