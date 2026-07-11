```yaml
schema: gentle-ai.verify-result/v1
evidence_revision: sha256:3d898785b899a3ec67a3027fe808a0383e59b1aaeea808bdee22f3c676397dae
verdict: fail
blockers: 0
critical_findings: 2
requirements: 23/25
scenarios: 26/30
test_command: npm test
test_exit_code: 0
test_output_hash: sha256:cda95adcf1a4b6a2e58dd15f9776a80d9b058955f60c7048a5ff24df9071c653
build_command: cmd.exe /d /s /c "npm run lint && npm run format:check"
build_exit_code: 0
build_output_hash: sha256:c33d0625ab3af34d50a443e0231e4ca3e25a898b4cb98deae435d0da6e3dbe97
```

## Verification Report

**Change**: professional-directory-structure  
**Version**: N/A  
**Mode**: Strict TDD  
**Artifact store**: Hybrid

### Completeness

| Metric | Value |
|---|---:|
| Requirements | 25 |
| Scenarios | 30 |
| Tasks total (actual recount) | 26 |
| Tasks complete | 26 |
| Tasks incomplete | 0 |

All 26 checkboxes in the current `tasks.md` are checked. The `apply-progress` headline saying `22/22` is inaccurate; its detailed TDD table contains all 26 task rows.

### Build & Tests Execution

| Command | Exit | Evidence |
|---|---:|---|
| `npm test` | 0 | 72 passed, 0 failed, 0 skipped; SHA-256 `cda95adcf1a4b6a2e58dd15f9776a80d9b058955f60c7048a5ff24df9071c653` |
| `npm run lint` | 0 | No ESLint findings; SHA-256 `b79fba735f7724dd70772d1bccdeaa492e4bf58808dc9b86955fd5d178e84698` |
| `npm run format:check` | 0 | All matched files formatted; SHA-256 `848816fb3276c1d00602f7bf3076dc388ec140d25467bbd70c59674d6a6271c0` |
| `node bin/backup.js --help` | 0 | Usage printed; SHA-256 `a69ea936964882ee8f44a2e6db90c18a29de8bea21df1cc52706bb05f33e1f39` |
| `node bin/regen-html.js --help` | 0 | Usage printed; SHA-256 `208ff159477cec3fba1e577781a2b2f083e956710c2fd8841a0c14be0df15ac5` |
| `npm run backup -- --help` | 0 | CLI usage printed |
| `npm run regen -- --help` | 0 | CLI usage printed |

**Coverage**: Analysis skipped — the cached testing capabilities report no coverage tool.  
**Type checker**: Not available.  
**Build**: No compilation step exists; lint plus format check is the configured quality/build gate.

### Spec Compliance Matrix

| Requirement | Scenario(s) | Runtime/static evidence | Result |
|---|---|---|---|
| Stale Output Files Removed | Stale output files present | `cleanup.test.js` (5 relevant cases) | ✅ COMPLIANT |
| Unused Assets Removed | Root logo exists | `cleanup.test.js` | ✅ COMPLIANT |
| Generated and Local Directories Removed | Generated directories present | `.codegraph/` and `.atl/` absent, but `node_modules/` currently exists | ❌ FAILING |
| Superseded SDD Changes Removed | Superseded directory exists | `cleanup.test.js` | ✅ COMPLIANT |
| Runtime Data Directories Preserved | Runtime data alongside stale artifacts | Directories exist; no before/after content manifest proves contents were untouched | ⚠️ PARTIAL |
| Cleanup Verification | Post-cleanup inventory | `layout.test.js` explicitly permits current `node_modules/`, contrary to the scenario | ❌ FAILING |
| CLI Entries Moved to bin/ | Move and remove root copies; run new CLIs | `layout.test.js`, `cli.test.js`, both direct help commands | ✅ COMPLIANT (2/2) |
| Library Modules Moved to src/ | Move and remove root copies | `layout.test.js` | ✅ COMPLIANT |
| Viewer Template Moved | Move template/remove legacy directory | `layout.test.js`, `utils.test.js` | ✅ COMPLIANT |
| Test Helper Moved | Move helper/remove scripts directory | `layout.test.js`, passing interruption test | ✅ COMPLIANT |
| Internal require Paths Updated | Load project without resolution errors | Full 72-test execution and CLI commands | ✅ COMPLIANT |
| Config Defaults Updated | Defaults resolve to project root | `config.test.js` | ✅ COMPLIANT |
| Template Path Updated | Generate HTML without file error/placeholders | `utils.test.js` empty and non-empty cases | ✅ COMPLIANT |
| Test Imports Updated | Full test suite | `npm test` | ✅ COMPLIANT |
| No Functional Changes | CLI parser/override behavior retained | `cli.test.js` regression assertions | ✅ COMPLIANT |
| package.json Points to New Paths | Metadata; npm CLI execution | `tooling-context.test.js`; both npm script commands | ✅ COMPLIANT (2/2) |
| ESLint Includes New Directories | New layout linted; runtime dirs ignored | Config inspection and passing lint | ✅ COMPLIANT (2/2) |
| Prettier Includes New Directories | Format check | Config inspection and passing format check | ✅ COMPLIANT |
| CI Workflow Uses New Commands | CI path references | Static workflow inspection plus commands executed locally; hosted CI was not run | ⚠️ PARTIAL |
| No New Tooling Dependencies | Dependency names unchanged | No trustworthy pre-change dependency manifest was supplied | ❌ UNTESTED |
| README Commands Use New Paths | Usage examples | `tooling-context.test.js` | ✅ COMPLIANT |
| AGENTS File Structure Updated | Structure/stack | Static inspection and `tooling-context.test.js` | ✅ COMPLIANT |
| AGENTS How to Run Updated | Run examples | Static inspection | ✅ COMPLIANT |
| OpenSpec Config Reflects Current Stack | Context; testing/quality sections | `tooling-context.test.js` and static inspection | ✅ COMPLIANT (2/2) |
| Runtime Data Directories Documented | Both docs | `tooling-context.test.js` | ✅ COMPLIANT |
| No Stale Path References | Current user-facing/context docs | Current-doc test and scan; historical archives retain historical paths | ✅ COMPLIANT |

**Compliance summary**: 26/30 scenarios compliant; 2 failing, 1 untested, 1 partial.

### Correctness (Static Evidence)

| Area | Status | Notes |
|---|---|---|
| Professional layout | ✅ Implemented | CLI files are under `bin/`; libraries under `src/`; template under `src/templates/`; helpers under `test/helpers/`; old root copies/directories are absent. |
| Internal paths | ✅ Implemented | Bin imports use `../src`; helper imports use `../../bin` and `../../src`; all resolve at runtime. |
| Runtime defaults/template | ✅ Implemented | `src/config.js` resolves project-root runtime paths; `src/utils.js` resolves `src/templates/viewer.html`. |
| Package/tooling/CI | ✅ Implemented | Package fields, scripts, lint/format ignores, and CI commands use the new layout. |
| Docs/context | ✅ Implemented | README, AGENTS, and OpenSpec config describe the new layout and protected runtime directories. |
| Cleanup final state | ❌ Not fully implemented | `node_modules/` was reinstalled and remains, violating the literal cleanup and final-inventory requirements. |

### Coherence (Design)

| Decision | Followed? | Notes |
|---|---|---|
| `bin/` + `src/` + `test/helpers/` layout | ✅ Yes | Current layout and passing tests agree. |
| Preserve `backups/` and `browser-profile/` | ⚠️ Partially provable | Both remain in place; unchanged contents cannot be independently established without a baseline manifest/hash. |
| Root-relative config defaults | ✅ Yes | Runtime-tested. |
| Source-owned viewer template | ✅ Yes | Runtime-tested. |
| Remove generated/local directories | ❌ No | `node_modules/` remains after verification dependencies were installed. |

The proposal is internally stale at line 62, where it says `backups/` and `browser-profile/` are removed despite the later resolved design/spec decision to preserve them.

### TDD Compliance

| Check | Result | Details |
|---|---|---|
| TDD evidence reported | ✅ | Detailed table exists in `apply-progress`. |
| All task rows represented | ✅ | 26/26 rows, despite the incorrect `22/22` headline. |
| RED confirmed | ❌ | Only 13 rows report an observable RED; 8 rows explicitly say RED was unavailable/partial after recovery, and 5 final/quality rows are N/A. Historical RED cannot be reconstructed. |
| GREEN confirmed | ✅ | Current suite passes 72/72 and the listed focused behaviors exist. |
| Triangulation adequate | ✅ | Structural, path, CLI, config, docs, and HTML behaviors use positive/negative or multiple input cases where applicable. |
| Safety net for modified files | ⚠️ | Recovery started from a partially moved filesystem; a clean pre-change safety-net run is not independently available. |

**TDD compliance**: 4/6 checks pass. Strict TDD process proof is incomplete. This report does not invent missing RED evidence.

### Test Layer Distribution

| Layer | Tests | Files | Tools |
|---|---:|---:|---|
| Unit | 65 | 9 | `node:test` |
| Integration | 5 | 2 | `node:test`, `child_process`, HTTP |
| E2E | 2 | 1 | `node:test`, Playwright |
| **Total** | **72** | **11** | |

Counts classify the complete current suite by test case; mixed files are counted in each layer they exercise.

### Changed File Coverage

Coverage analysis skipped — no coverage tool detected.

### Assertion Quality

The change-related tests were inspected for tautologies, assertions without production behavior, ghost loops, smoke-only checks, and mock-heavy patterns.

**Assertion quality**: ✅ No banned/trivial assertion pattern found.

### Quality Metrics

**Linter**: ✅ No errors or warnings  
**Formatter**: ✅ All matched files formatted  
**Type Checker**: ➖ Not available

### Issues Found

**CRITICAL**

1. `node_modules/` currently exists. This directly violates the spec's “Generated and Local Directories Removed” scenario and the final cleanup inventory scenario. `test/layout.test.js` weakens the required inventory by explicitly allowing `node_modules/`.
2. Strict TDD evidence is incomplete after recovery. Several required RED stages cannot be reconstructed, so the strict process claim fails closed even though current runtime behavior is green.

**WARNING**

1. `apply-progress` and the abbreviated Engram tasks summary claim 22 tasks, while the actual artifact has 26 completed tasks.
2. Preservation of the contents of `backups/` and `browser-profile/` cannot be proven without a pre-apply manifest/hash; only current existence is verified.
3. Hosted GitHub Actions was not executed; workflow correctness is supported by static inspection and equivalent local commands only.
4. No pre-change dependency manifest was supplied, so “No New Tooling Dependencies” remains untested.
5. Hybrid persistence is incomplete for the spec artifact: the full spec exists in Engram/canonical `openspec/specs/`, but no change-local spec file exists under `openspec/changes/professional-directory-structure/`.
6. The proposal's affected-areas table still says protected runtime directories are removed, contradicting the resolved design/spec.

**SUGGESTION**: None.

### Verdict

**FAIL**

The implementation's runtime and quality checks are green, but current filesystem state violates two mandatory cleanup scenarios and strict TDD history is not fully provable after the recovery apply.
