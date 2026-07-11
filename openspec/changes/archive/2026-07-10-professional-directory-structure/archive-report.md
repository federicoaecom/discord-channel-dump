# Archive Report: Professional Directory Structure

**Archived**: 2026-07-10  
**Change**: `professional-directory-structure`  
**Previous changes**: `project-quality-review`, `testing-scaffolding`, `reliable-secure-backups`

## Outcome

**Verdict**: **PASS** (with two documented process exceptions approved by user)

All 72 tests pass, lint and format are clean, both CLI entry points work. The workspace layout is:

```
├── bin/              # CLI entry points
├── src/              # Library modules, templates
├── test/             # Tests and helpers
├── backups/          # Runtime data (preserved)
├── browser-profile/  # Runtime data (preserved)
└── node_modules/     # Local dependencies (git-ignored)
```

### User-Approved Exceptions

1. **`node_modules/` not deleted**: The spec's "Generated and Local Directories Removed" scenario is relaxed — `node_modules/` is treated as local dependency state (git-ignored, not authored code) and exempted from deletion. The user explicitly confirmed this on 2026-07-10.

2. **Red TDD evidence gap**: Historical RED test phases from the initial apply's blank machine output cannot be recovered. The user explicitly accepted this as a documented recovery limitation.

3. **Archive override**: No `reviewGate.result: allow` exists in the environment; the user explicitly approved the archive override.

## Delivered Scope

- Removed stale artifacts (`*_output.txt`, `logo.png`, `.codegraph/`, `.atl/`, `templates/`, `scripts/`)
- Moved CLI entries to `bin/`, library modules to `src/`, template to `src/templates/`, helper to `test/helpers/`
- Updated all `require()` paths, config defaults, and template paths
- Updated `package.json`, `.eslintrc.json`, `.prettierignore`, CI workflow
- Updated README, AGENTS.md, openspec/config.yaml
- Preserved `backups/` and `browser-profile/` (runtime data)
- `node_modules/` retained as git-ignored local dependency state

## Specs

Specs remain in `openspec/specs/` and are considered canonical.

## Build & Test Summary

| Check | Result |
|---|---|
| `npm test` | 72/72 pass |
| `npm run lint` | Clean |
| `npm run format:check` | All files formatted |
| `node bin/backup.js --help` | Works |
| `node bin/regen-html.js --help` | Works |
