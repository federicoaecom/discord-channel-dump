# Proposal: Testing Scaffolding

## Intent

Add automated testing and code-quality tooling to `discord-channel-dump` so future changes can be verified without relying on manual, live Discord runs. This follows the `project-quality-review` change and keeps the project dependency-light by using Node.js native tooling.

## Scope

### In Scope
- `node:test` + `node:assert` test runner and scripts.
- Unit tests for `config.js` (`validateConfig`) and `utils.js` helpers.
- Export `parseCliArgs` from `backup.js` and `regen-html.js` to make it unit-testable.
- CLI smoke tests for `--help` and `--version`.
- ESLint + Prettier dev dependencies with minimal config and a `lint` script.
- `.github/workflows/ci.yml` workflow file (active only after git init and push).

### Out of Scope
- Live Discord/Playwright browser tests.
- E2E tests or TypeScript migration.

## Capabilities

> This section is the CONTRACT between proposal and specs phases.
> The sdd-spec agent reads this to know exactly which spec files to create or update.
> Research `openspec/specs/` before filling this in.

### New Capabilities
- `native-test-runner`: `node:test` setup, `test` scripts, `test/` directory.
- `unit-tests`: tests for `config.js` and `utils.js`.
- `cli-smoke-tests`: smoke tests for `--help`/`--version`.
- `quality-tooling`: ESLint + Prettier config and scripts.
- `ci-workflow`: GitHub Actions workflow file.

### Modified Capabilities
- None

## Approach

Use Node.js 18+ built-in `node:test` and `node:assert` to avoid test dependencies. Add unit tests for pure helpers and `validateConfig`, export `parseCliArgs` from both CLI modules, and verify CLI `--help`/`--version` via `child_process`. Add ESLint (`eslint:recommended`) and Prettier with `npm run lint` and `format` scripts. Include a minimal GitHub Actions workflow that runs install, lint, and tests on Node 18+.

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `package.json` | Modified | Add `test`, `test:watch`, `lint`, `format` scripts and dev dependencies. |
| `config.js` | None | Already exports `validateConfig`; no source changes. |
| `utils.js` | None | No source changes; tests cover existing helpers. |
| `backup.js` | Modified | Export `parseCliArgs` and `applyOverrides` for unit tests. |
| `regen-html.js` | Modified | Export `parseCliArgs` for unit tests. |
| `test/*.test.js` | New | Unit and CLI smoke test files. |
| `.eslintrc.json`/`eslint.config.*` | New | Minimal ESLint configuration. |
| `.prettierrc` | New | Minimal Prettier configuration. |
| `.github/workflows/ci.yml` | New | CI workflow (inactive until git push). |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Exporting CLI helpers changes module surface | Low | Only export pure parsing functions; leave `main()` guarded. |
| Tests fail on Windows path separators | Med | Use `path` helpers, avoid hard-coded `/` in assertions. |
| CI file is dead code until git remote push | Med | Document in README/comment inside workflow. |

## Rollback Plan

1. Revert `package.json` to remove test/lint scripts and dev dependencies, then run `npm install`.
2. Delete `test/`, ESLint/Prettier config files, and `.github/workflows/ci.yml`.
3. Remove `module.exports` additions from `backup.js` and `regen-html.js`.

## Dependencies

- Node.js 18+ (already required by `engines.node`).
- GitHub repository initialized and pushed for CI to run.

## Success Criteria

- [ ] `npm test` runs and passes.
- [ ] `npm run lint` runs without errors.
- [ ] `npm run format:check` reports no unformatted files.
- [ ] All unit tests cover valid/invalid config values and `utils.js` helpers.
- [ ] `--help` and `--version` smoke tests pass for both CLI entry points.
