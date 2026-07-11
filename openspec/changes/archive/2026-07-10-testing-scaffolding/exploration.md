## Exploration: Testing Scaffolding for DISCORD-BACKUP

### Current State

`discord-channel-dump` is a Node.js CommonJS CLI tool with no test framework, no linter, no formatter, and no type checker. The previous `project-quality-review` change extracted helper modules and introduced configuration validation, but it did not add any automated testing. The project has a declared GitHub repository URL but is not a git repository in this environment.

Functions that are already testable:
- `config.js` → `validateConfig`, `ConfigError` (exported).
- `utils.js` → `sanitize`, `escapeHtml`, `filenameFromUrl`, `uniqueFilename`, `iconFor`, `generateHtml` (exported).
- `downloader.js` → `downloadFile` (exported, but network-dependent).

Functions that are currently **not** testable in isolation:
- `backup.js` → `parseCliArgs`, `applyOverrides`, `normalizeMessage`, `fetchAllMessages`, `downloadMedia`, `captureLoop` (all module-local).
- `regen-html.js` → `parseCliArgs` (module-local).
- Browser/Discord API flows rely on a real Playwright session and live Discord token.

### Affected Areas

- `package.json` — add `test`/`test:*` scripts and dev dependencies (test runner, lint, format).
- `config.js` — already exports `validateConfig`; tests can cover valid/invalid values.
- `utils.js` — pure helpers and `generateHtml` are easy to unit test; may need a test fixture for `templates/viewer.html`.
- `backup.js` — `parseCliArgs`/`applyOverrides` should be exported (or tested via CLI smoke tests) before unit testing.
- `regen-html.js` — `parseCliArgs` should be exported or covered via CLI smoke tests.
- `downloader.js` — download logic requires a local HTTP mock server or stubbed `http`/`https` module.
- `.gitignore` — ensure coverage/artifact folders are excluded if added.
- `openspec/config.yaml` — update `testing` and `verify` sections after test runner is chosen.
- `.github/workflows/` (optional) — new CI file, but only useful once the project is initialized as a git repository and pushed.

### Approaches

1. **Minimal built-in test runner (Node.js `node:test`)**
   - Use Node.js 18+ native `node:test` and `node:assert` — zero new dependencies, already supported by `engines.node`.
   - Unit tests for `config.js`, `utils.js`, and CLI smoke tests for `--help`/`--version` via `child_process`.
   - Pros: no extra dependencies, fast, native to the runtime, works with CommonJS.
   - Cons: less ergonomic than Jest/Vitest, no built-in mocking, watch mode requires manual setup.
   - Effort: Low

2. **Vitest or Jest test suite**
   - Add `vitest` (ESM/CJS friendly) or `jest` as a dev dependency with more ergonomic matchers and mocking.
   - Pros: richer assertions, built-in mocking, watch mode, coverage plugins, widely documented.
   - Cons: extra dependencies; Jest can be slower and requires CommonJS configuration; Vitest is newer but may be unnecessary for this project size.
   - Effort: Medium

3. **Add linting + formatting (ESLint + Prettier)**
   - Add `eslint` and `prettier` as dev dependencies with minimal config (e.g. `eslint:recommended`, `prettier --write`).
   - Pros: catches common bugs, consistent style, low overhead, integrates with CI.
   - Cons: adds config files and dev dependencies, can be noisy at first.
   - Effort: Low

4. **Add TypeScript/JSDoc type checking**
   - Use TypeScript in `checkJs` mode with JSDoc annotations, or perform a full migration to TypeScript.
   - Pros: catches type errors, improves IDE support, documents the public API.
   - Cons: full migration is high effort; `checkJs` is lighter but still requires `tsconfig.json` and annotations.
   - Effort: Medium to High

5. **GitHub Actions CI**
   - Add a minimal workflow that runs `npm install`, lint, format check, and tests on Node 18+ on push/PR.
   - Pros: catches regressions early, signals project maturity.
   - Cons: the project is not yet a git repository, so the workflow will not run until `git init`, remote configuration, and push; Playwright browser install is heavy if any E2E test needs it.
   - Effort: Low (for the file), but requires git setup to become active.

### Recommendation

Adopt **Approach 1 (Node.js native `node:test`)** as the primary test runner. It is the best fit for this codebase because the project already requires Node 18+, it avoids adding test dependencies, and it keeps the change focused and reviewable. Pair it with **Approach 3 (ESLint + Prettier)** for quality tooling, because they are lightweight and complement the tests without a large migration.

Scope for this change:
1. Add a `test/` directory with `*.test.js` files covering:
   - `config.test.js` — valid config, invalid `apiBatchSize`, negative `apiDelayMs`, missing/empty `backupDir`, etc.
   - `utils.test.js` — `sanitize`, `escapeHtml`, `filenameFromUrl`, `uniqueFilename`, `iconFor`, `generateHtml` (with a temporary template fixture or by using the real `templates/viewer.html`).
   - `backup.cli.test.js` — `parseCliArgs` (after exporting it) and smoke tests for `--help`/`--version`.
   - `regen-html.cli.test.js` — same pattern as `backup.js`.
2. Add `test` and `test:watch` scripts to `package.json`.
3. Add `eslint` and `prettier` as dev dependencies with basic config and a `lint` script.
4. Add a `.github/workflows/ci.yml` file, but clearly note that it only becomes active after the project is initialized as a git repository and pushed to the configured GitHub remote.
5. Skip Playwright/E2E browser tests and live Discord API tests in this change; rely on unit tests and smoke tests only.
6. Skip TypeScript in this change; consider it separately if the project grows or if type safety becomes a recurring pain point.

### Risks

- **Exporting internal functions for testing** — `backup.js` and `regen-html.js` currently keep `parseCliArgs` and related helpers module-private. Exporting them is a small, safe refactor, but it changes the module surface. Smoke tests via `child_process` can avoid this if the team prefers not to export.
- **Playwright/browser flow is out of scope** — the live Discord session, token capture, and message fetching cannot be exercised reliably in automated tests without real credentials or complex mocking. Any attempt to test these must be deferred or mocked.
- **Cross-platform paths** — `filenameFromUrl` already uses `path.posix.basename`, but tests running on Windows must not assert Linux-specific paths. Tests should be written to be platform-agnostic.
- **Network-dependent downloader tests** — `downloadFile` tests should either spin up a local HTTP server or stub `http`/`https` to avoid flakiness and external network calls.
- **CI is not immediately active** — because the project is not a git repository, adding a GitHub Actions workflow is only a file-level change; the CI will not run until git is initialized and pushed.

### Ready for Proposal

Yes. The next step is to write a proposal for `testing-scaffolding` that scopes the work to: native `node:test` unit tests, ESLint + Prettier, minimal CLI smoke tests, and a GitHub Actions workflow file (with the caveat that git initialization is required for CI to be active). The orchestrator should tell the user that no live Discord or browser tests will be added in this change, and that a small refactor (exporting `parseCliArgs` from CLI modules) may be needed to make the CLI parsing unit-testable.
