# Design: Testing Scaffolding

## Technical Approach

Add Node.js native test tooling (`node:test` + `node:assert/strict`) plus ESLint and Prettier as dev dependencies. Make the two CLI entry points testable by guarding their `main()` execution and exporting pure parsing helpers. Cover `config.js`, `utils.js`, and CLI parsing with unit tests; verify `--help`/`--version` with `child_process` smoke tests. Wire everything into a GitHub Actions workflow and enable strict TDD in `openspec/config.yaml`.

## Architecture Decisions

| Decision | Choice | Alternatives | Rationale |
|---|---|---|---|
| Test runner | `node:test` + `node:assert/strict` | Jest, Mocha, Vitest | Zero test dependencies; aligns with Node 18+ engines and the proposal. |
| CLI testability | Guard `main()` with `require.main === module` and export `parseCliArgs`/`applyOverrides` | Refactor into separate CLI modules | Minimal change to existing structure; keeps entry points self-contained. |
| ESLint config | `.eslintrc.json` extending `eslint:recommended` | Flat config (`eslint.config.js`) | Simpler setup for a CommonJS project; avoids needing `@eslint/js`. |
| Test file layout | `test/{domain}.test.js` | Co-located `*.spec.js` | Mirrors project modules; easy discovery by `node --test test/`. |
| Smoke test approach | `child_process.spawnSync` | `execa` | Built-in only; avoids extra dependencies. |

## Data Flow

```
CLI args  → parseCliArgs (unit tested)
               ↓
        applyOverrides → config.validateConfig
               ↓
      child_process smoke test verifies --help/--version
               ↓
   node:test runner reports pass/fail
```

## File Changes

| File | Action | Description |
|---|---|---|
| `package.json` | Modify | Add `test`, `test:watch`, `lint`, `format`, `format:check` scripts; add `eslint` and `prettier` to `devDependencies`. |
| `backup.js` | Modify | Guard `main()` with `require.main === module`; export `parseCliArgs` and `applyOverrides`. |
| `regen-html.js` | Modify | Guard `main()` with `require.main === module`; export `parseCliArgs`. |
| `test/config.test.js` | Create | Unit tests for `validateConfig` and `ConfigError`. |
| `test/utils.test.js` | Create | Unit tests for `utils.js` helpers and `generateHtml`. |
| `test/cli.test.js` | Create | Unit tests for exported parsers and smoke tests for `--help`/`--version`. |
| `.eslintrc.json` | Create | Minimal ESLint config extending `eslint:recommended`. |
| `.prettierrc` | Create | Minimal Prettier config. |
| `.github/workflows/ci.yml` | Create | CI workflow running lint, format check, and tests on Node 18+. |
| `openspec/config.yaml` | Modify | Enable `strict_tdd` and update testing/quality tool availability. |

## Interfaces / Contracts

```js
// backup.js exports
module.exports = { parseCliArgs, applyOverrides };
// main() only runs when require.main === module

// regen-html.js exports
module.exports = { parseCliArgs };

// Test contract: all filesystem paths use path.join / path.resolve
// No hard-coded Windows separators in assertions
```

## Testing Strategy

| Layer | What to Test | Approach |
|---|---|---|
| Unit | `validateConfig`, `utils.js` helpers, `generateHtml` | `node:test` with `assert/strict`; use temp dirs via `fs.mkdtempSync`. |
| Unit | `parseCliArgs`/`applyOverrides` from CLI modules | Require exported functions; assert returned objects and config mutations. |
| Smoke | `backup.js` and `regen-html.js` `--help`/`--version` | `child_process.spawnSync`; assert stdout and exit code; verify no hang. |

Strict TDD: after this change, every future production change MUST have a failing RED test first. The `test` script becomes the gate in `openspec/config.yaml` (`apply.tdd: true`, `verify.test_command: npm test`). Developers run `npm test` before committing; the CI workflow enforces it on every push and pull request.

## Threat Matrix

N/A — the CI workflow is static declarative YAML; it does not execute git commands, PR commands, shell commands, subprocesses, executable classification, or process integration from application code. No runtime routing/shell/process boundary is introduced.

## Migration / Rollout

No migration required. After implementation, run `npm install` to install dev dependencies, then `npm test`, `npm run lint`, and `npm run format:check` to verify. Update `openspec/config.yaml` to mark testing and quality tooling as available.

## Open Questions

- None
