# Tasks: Project Quality Review

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | 700–900 |
| 400-line budget risk | High |
| Chained PRs recommended | Yes |
| Suggested split | Single PR with `size-exception`, or chained PRs (docs → config/template → CLI/backup refactor) |
| Delivery strategy | single-pr |
| Chain strategy | size-exception |

Decision needed before apply: Yes
Chained PRs recommended: Yes
Chain strategy: size-exception
400-line budget risk: High

The HTML template extraction (~250 lines) plus `backup.js` refactor and documentation updates push the likely diff above the 800-line budget. Treat as a single `size-exception` PR, or split into the chained work units below.

### Suggested Work Units

| Unit | Goal | Likely PR | Focused test command | Runtime harness | Rollback boundary |
|------|------|-----------|----------------------|-----------------|-------------------|
| 1 | Docs and package metadata | PR 1 | `node -e "console.log(require('./package.json').version)"` | `npm install` engine check | `AGENTS.md`, `README.md`, `package.json` |
| 2 | Config validation and HTML template extraction | PR 2 | `node -e "require('./config').validateConfig({apiBatchSize:0})"` | `node regen-html.js backups/sample` | `config.js`, `utils.js`, `templates/viewer.html` |
| 3 | CLI and backup refactor | PR 3 | `node backup.js --help` | `node backup.js --output ./tmp-test` | `backup.js`, `regen-html.js` |

## Phase 1: Foundation

- [x] 1.1 Create `AGENTS.md` with stack, file structure, and run instructions.
- [x] 1.2 Update `package.json` with `bin`, `engines`, `license`, `repository`, `keywords`.
- [x] 1.3 Rewrite `README.md` in consistent English, cross-platform paths, and relative links.

## Phase 2: Core Implementation

- [x] 2.1 Add `validateConfig` to `config.js` and export defaults.
- [x] 2.2 Extract HTML template from `utils.js` into `templates/viewer.html`.
- [x] 2.3 Update `utils.js` `generateHtml` to read `templates/viewer.html` and substitute tokens.
- [x] 2.4 Add `parseCliArgs`, `printHelp`, `printVersion` helpers to `backup.js`.
- [x] 2.5 Decompose `backup.js` main flow into `runBrowserSession`, `captureLoop`, `processChannel`.
- [x] 2.6 Replace hardcoded path separators with `path.join` in `backup.js`.

## Phase 3: Integration

- [x] 3.1 Wire CLI overrides for `backupDir` and `profileDir` into `backup.js` and call `validateConfig`.
- [x] 3.2 Add `--help`, exit codes, and cross-platform examples to `regen-html.js`.

## Phase 4: Verification

- [x] 4.1 Verify `node backup.js --help` and `node backup.js --version`.
- [x] 4.2 Verify `node backup.js` still launches the interactive browser flow.
- [x] 4.3 Verify `--output` and `--profile` overrides write to the correct directories.
- [x] 4.4 Verify invalid `apiBatchSize`/`apiDelayMs`/`downloadTimeoutMs` exit with clear errors.
- [x] 4.5 Verify `node regen-html.js --help` and regeneration of `index.html`.
- [x] 4.6 Inspect `AGENTS.md`, README links, and `package.json` metadata.
