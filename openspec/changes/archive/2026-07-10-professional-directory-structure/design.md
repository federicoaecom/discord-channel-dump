# Design: Professional Directory Structure

## Technical Approach

Move the project to an idiomatic Node.js CLI layout: `bin/` for executables, `src/` for libraries, `src/templates/` for the viewer template, and `test/helpers/` for shared fixtures. Delete stale output files, unused assets, and generated/local directories, leaving `backups/` and `browser-profile/` untouched. Update all internal `require()` paths, `__dirname`-based defaults, npm scripts, tooling configs, CI, and docs in one pass. With strict TDD active, every move is preceded by a RED test and verified GREEN.

## Architecture Decisions

| Decision | Options | Tradeoffs | Choice |
|---|---|---|---|
| Layout | Flat root vs. `bin/` + `src/` | Root is simple; standard layout separates concerns and matches tooling | `bin/`, `src/`, `test/helpers/` |
| Runtime data | Delete / move / keep | `backups/` and `browser-profile/` contain user data; deleting or moving risks loss | Keep in place; document as runtime directories |
| `config.js` defaults | `__dirname` vs. `path.join(__dirname, "..", ...)` | After moving to `src/`, `__dirname` points to `src/` | `path.join(__dirname, "..", "backups")` and `path.join(__dirname, "..", "browser-profile")` |
| Template path | Keep in `templates/` vs. `src/templates/` | Template belongs with source; path must adjust | `path.join(__dirname, "templates", "viewer.html")` from `src/utils.js` |
| Test helper | `scripts/` vs. `test/helpers/` | `scripts/` is ambiguous; `test/helpers/` is idiomatic | `test/helpers/run-interrupt.js` |

## Data Flow

```
bin/backup.js ──require──> src/config.js, src/utils.js, src/downloader.js, src/cancel-token.js
bin/regen-html.js ──require──> src/utils.js
src/utils.js ──readFile──> src/templates/viewer.html
tests ──require──> ../src/... and ../bin/...
```

## File Changes

| File | Action | Description |
|------|--------|-------------|
| `bin/backup.js` | Move | From root `backup.js`; update `require()` to `../src/...` |
| `bin/regen-html.js` | Move | From root `regen-html.js`; update `require()` to `../src/...` |
| `src/config.js` | Move | From root; defaults to `path.join(__dirname, "..", ...)` |
| `src/utils.js` | Move | From root; template path points to `src/templates/viewer.html` |
| `src/downloader.js` | Move | From root; `require("./config")` |
| `src/cancel-token.js` | Move | From root |
| `src/templates/viewer.html` | Move | From `templates/viewer.html` |
| `test/helpers/run-interrupt.js` | Move | From `scripts/run-interrupt.js`; update imports |
| `test/*.test.js` | Modify | Update imports to `../src/...` or `../bin/...` |
| `package.json` | Modify | `main`, `bin`, scripts point to `bin/` |
| `.eslintrc.json` | Modify | Add `openspec/` to ignores; keep runtime ignores |
| `.prettierignore` | Modify | Remove stale `templates/`; ensure `bin/`, `src/`, `test/` are not excluded; ignore `src/templates/viewer.html` |
| `.github/workflows/ci.yml` | Modify | Add `node bin/backup.js --help` and `node bin/regen-html.js --help` smoke tests; keep `npm` quality steps |
| `README.md` | Modify | New commands and file structure |
| `AGENTS.md` | Modify | New layout and current stack |
| `openspec/config.yaml` | Modify | Current stack, layout, test/lint/format availability |
| `*_output.txt`, `logo.png` | Delete | Stale outputs and unused asset |
| `node_modules/`, `.codegraph/`, `.atl/` | Delete | Generated/local directories |
| `openspec/changes/post-hardening-improvements/` | Delete | Superseded SDD change |
| Root module files | Delete | Copies after move to `bin/`/`src/` |

## Interfaces / Contracts

No new interfaces. CommonJS exports remain unchanged. Only internal resolution changes:

- `bin/backup.js` → `../src/{config,utils,downloader,cancel-token}`, `../package.json`
- `bin/regen-html.js` → `../src/utils`, `../package.json`
- `src/utils.js` → `path.join(__dirname, "templates", "viewer.html")`
- `src/config.js` → `path.join(__dirname, "..", "backups")`, `path.join(__dirname, "..", "browser-profile")`
- `src/downloader.js` → `./config`
- `test/helpers/run-interrupt.js` → `./fixture-server`, `../../bin/backup`, `../../src/config`

## Testing Strategy

| Layer | What to Test | Approach |
|-------|-------------|----------|
| Unit | `parseCliArgs`, `applyOverrides`, `generateHtml`, `validateConfig` after moves | `node --test` with updated `require()` paths |
| Integration | `node bin/backup.js --help`, `node bin/regen-html.js --help`, `npm test`, `npm run lint`, `npm run format:check` | `spawnSync` and npm commands |
| E2E | Regenerate HTML from `bin/regen-html.js` and verify no unresolved placeholders | Test backup folder + CLI |

Strict TDD: write RED tests asserting new paths and layout before applying changes, then move files and update paths until GREEN. Every task records RED → GREEN → REFACTOR evidence.

## Threat Matrix

| Boundary | Minimum adversarial cases | Applicability | Design response | Planned RED tests |
|---|---|---|---|---|
| Documentation-like paths | `requirements.txt`, `CMakeLists.txt`, executable Markdown/MDX, `README.sh` | N/A — project uses clear `.js` executables and `package.json` bin field; no docs treated as code | — | — |
| Git repository selection | `git -C`, relative paths, absolute paths | N/A — no git commands executed by application or tests | — | — |
| Commit state | staged, `commit -a`, empty index | N/A — no git commit operations performed | — | — |
| Push state | tracking branch, first push, explicit refspec | N/A — no git push operations performed | — | — |
| PR commands | explicit `--head`, environment prefix, composed commands | N/A — no PR or git commands invoked | — | — |

Applicable process/workspace boundaries: executable relocation to `bin/`, process spawn paths in tests, and workspace cleanup. Safety requirements:
- Cleanup never deletes, moves, or modifies `backups/` or `browser-profile/`.
- Process spawn tests use absolute paths to `bin/backup.js` and `bin/regen-html.js`.
- Cleanup targets only explicit known stale paths; no wildcard deletion of user data.

## Migration / Rollout

No migration required. `backups/` and `browser-profile/` stay in place. After restructuring, run `npm install` (since `node_modules/` is removed) and `npm test` to verify.

## Open Questions

None. User decision: keep `backups/` and `browser-profile/` untouched.
