## Exploration: Professional directory structure

### Current State
All source modules and CLI entry points live in the project root (`backup.js`, `regen-html.js`, `config.js`, `utils.js`, `downloader.js`, `cancel-token.js`). The `test/` directory already exists, but a test helper (`scripts/run-interrupt.js`) is outside it. Runtime output (`backups/`, `browser-profile/`), local tooling indexes (`.codegraph/`, `.atl/`), and stale verification dumps (`*_output.txt`) are present in the workspace even though they are ignored by `.gitignore`. The project has tests, lint, format, and CI, but `AGENTS.md` and `openspec/config.yaml` still claim the opposite.

### Affected Areas
- `backup.js` — main CLI entry point; should move to `bin/`.
- `regen-html.js` — secondary CLI entry point; should move to `bin/`.
- `config.js`, `utils.js`, `downloader.js`, `cancel-token.js` — core library modules; should move to `src/`.
- `templates/viewer.html` — template asset; should move with source code (`src/templates/`).
- `scripts/run-interrupt.js` — test helper, not a build/dev script; should move to `test/helpers/`.
- `test/*.test.js` — need updated `require()` paths.
- `package.json` — `main`, `bin`, and npm scripts need new paths.
- `.eslintrc.json`, `.prettierrc`, `.prettierignore` — need to include new directories.
- `README.md`, `AGENTS.md` — commands and file references need updating.
- `openspec/config.yaml` — stale context needs refreshing.
- `format_output.txt`, `help_output.txt`, `lint_output.txt`, `test_output.txt` — stale output artifacts; delete.
- `logo.png` — unused asset; delete.
- `backups/`, `browser-profile/`, `node_modules/`, `.codegraph/`, `.atl/` — generated/local; delete from workspace.
- `openspec/changes/post-hardening-improvements/` — superseded by archived `reliable-secure-backups`; archive or delete.

### Before/After Structure

**Before (root-heavy)**
```
.
├── .atl/
├── .codegraph/
├── .github/
│   └── workflows/ci.yml
├── .eslintrc.json
├── .prettierrc
├── .prettierignore
├── AGENTS.md
├── LICENSE
├── README.md
├── backup.js
├── backups/              <- user data (~266 MB)
├── browser-profile/      <- runtime session (~50 MB)
├── browser-profile/
├── cancel-token.js
├── config.js
├── downloader.js
├── format_output.txt
├── help_output.txt
├── lint_output.txt
├── logo.png
├── node_modules/         <- generated (~37 MB)
├── openspec/
├── package-lock.json
├── package.json
├── regen-html.js
├── scripts/
│   └── run-interrupt.js
├── templates/
│   └── viewer.html
├── test/
│   ├── helpers/
│   │   └── fixture-server.js
│   ├── cancel-token.test.js
│   ├── cli.test.js
│   ├── config.test.js
│   ├── downloader.test.js
│   ├── fixture-server.test.js
│   ├── interrupt.test.js
│   ├── utils.test.js
│   └── viewer-dom.test.js
├── test_output.txt
└── utils.js
```

**After (professional Node CLI layout)**
```
.
├── .github/
│   └── workflows/ci.yml
├── bin/
│   ├── backup.js
│   └── regen-html.js
├── src/
│   ├── cancel-token.js
│   ├── config.js
│   ├── downloader.js
│   ├── utils.js
│   └── templates/
│       └── viewer.html
├── test/
│   ├── helpers/
│   │   ├── fixture-server.js
│   │   └── run-interrupt.js
│   ├── cancel-token.test.js
│   ├── cli.test.js
│   ├── config.test.js
│   ├── downloader.test.js
│   ├── fixture-server.test.js
│   ├── interrupt.test.js
│   ├── utils.test.js
│   └── viewer-dom.test.js
├── .eslintrc.json
├── .gitignore
├── .prettierrc
├── .prettierignore
├── AGENTS.md
├── LICENSE
├── README.md
├── openspec/
├── package-lock.json
├── package.json
└── (no generated/stale artifacts in workspace)
```

### Approaches
1. **Standard Node CLI layout (`bin/` + `src/` + `test/`)**
   - Move CLI entries to `bin/`, library modules to `src/`, templates to `src/templates/`, and the interrupt helper to `test/helpers/`.
   - Pros: Clear separation of concerns; aligns with Node/npm conventions; keeps `package.json` `bin` simple.
   - Cons: Requires updating `__dirname` paths in `config.js` and `utils.js` and many `require()` paths.
   - Effort: Medium.

2. **Single `src/` tree with `src/cli/`**
   - Keep all authored code under `src/`, including CLI entry points in `src/cli/`.
   - Pros: Everything source-related in one folder; easy for monorepo-like tooling.
   - Cons: Less conventional for npm CLI packages; `bin` field needs to point deep into `src/`.
   - Effort: Medium.

3. **Minimal restructure (keep CLI at root)**
   - Move only library modules to `src/`, leaving `backup.js` and `regen-html.js` at root.
   - Pros: Fewer path changes.
   - Cons: Does not solve the root-clutter problem; leaves entry points mixed with docs/config.
   - Effort: Low.

### Recommendation
Adopt Approach 1: `bin/` for CLI entry points, `src/` for library modules, `test/` for tests (with helpers inside), and `src/templates/` for the viewer template. This is the most idiomatic Node.js CLI structure and satisfies the requirement to separate source, tests, and config.

### Work Units
1. **Cleanup generated and stale artifacts**
   - Delete `format_output.txt`, `help_output.txt`, `lint_output.txt`, `test_output.txt`, `logo.png`.
   - Delete `backups/`, `browser-profile/`, `node_modules/`, `.codegraph/`, `.atl/` from the workspace.
   - Archive or delete `openspec/changes/post-hardening-improvements/`.
   - Verify: workspace contains only tracked project files plus `openspec/`.

2. **Move files and update paths/scripts**
   - Move CLI entries to `bin/`, library modules to `src/`, `templates/viewer.html` to `src/templates/`, `scripts/run-interrupt.js` to `test/helpers/`.
   - Update `package.json`: `main`, `bin`, npm scripts (`backup`, `regen`, `test`, `lint`, `format`).
   - Update `config.js` defaults to use `path.join(__dirname, "..", ...)` so `backupDir`/`profileDir` still point to the project root.
   - Update `utils.js` template path to `path.join(__dirname, "templates", "viewer.html")` (template now sits next to it).
   - Update all `require()` paths in `bin/`, `src/`, and `test/`.
   - Update `.eslintrc.json` and `.prettierignore` paths/ignore patterns.
   - Verify: `npm test`, `npm run lint`, `npm run format:check` pass.

3. **Update documentation and SDD context**
   - Update `README.md` commands (`node bin/backup.js`, `node bin/regen-html.js`).
   - Update `AGENTS.md` file structure and stack description (tests/lint/format/CI exist now).
   - Update `openspec/config.yaml` context to reflect the current stack and testing setup.
   - Verify: docs match the new layout and no stale references remain.

### Risks
- `config.js` uses `__dirname` to default `backupDir` and `profileDir` to the project root; moving it to `src/` changes these defaults unless updated to `path.join(__dirname, "..", ...)`.
- `utils.js` loads `templates/viewer.html` relative to `__dirname`; moving both files requires path adjustment.
- Deleting `backups/` removes ~266 MB of user-generated channel data; confirm backup or that it is safe to delete.
- `node_modules/` deletion forces a reinstallation; `.codegraph/` deletion forces reindexing.
- Many `require()` and spawn paths in tests and docs must be updated together or CI and tests break.
- File moves produce a large diff even though most lines are unchanged; review should treat it as a move rather than a rewrite.

### Ready for Proposal
Yes. The scope is a medium refactor/cleanup with clear before/after structure. Recommend splitting into the three work units above so the cleanup, restructuring, and documentation updates can be reviewed separately.
