```yaml
schema: gentle-ai.verify-result/v1
evidence_revision: sha256:862ac429bd654f2d31bb24eec75cdc5628121c273445e081a871fcfebfc8a6d2
verdict: pass
blockers: 0
critical_findings: 0
requirements: 14/14
scenarios: 4/4
test_command: npm test
test_exit_code: 0
test_output_hash: sha256:cdd12704b6f19fbc37527ebf4fb053dc8ddda3ece20c041d0bc654c483675823
build_command: cmd.exe /d /s /c "(npm run lint && npm run format:check && npm pack --dry-run)"
build_exit_code: 0
build_output_hash: sha256:63b3417eaac2c355730b6974ae0d4c1ad4f8dd000c7c29b94bb13abdf6507067
```

## Verification Report

**Change**: ci-config-hardening
**Version**: N/A
**Mode**: Standard
**Artifact store**: OpenSpec

### Completeness

| Metric | Value |
|---|---:|
| Requirements | 14 |
| Scenarios | 4 |
| Tasks total | 18 |
| Tasks complete | 18 |
| Tasks incomplete | 0 |

All 18 task checkboxes are complete. Full verification was permitted. Strict TDD is disabled by `openspec/config.yaml`; historical RED provenance was not evaluated.

### Build & Tests Execution

| Command | Exit | Evidence |
|---|---:|---|
| `npm test` | 0 | 195 passed, 0 failed, 0 skipped; SHA-256 `cdd12704b6f19fbc37527ebf4fb053dc8ddda3ece20c041d0bc654c483675823` |
| `node --test test/config.test.js test/cli.test.js test/tooling-context.test.js` | 0 | 44 passed, 0 failed, 0 skipped; SHA-256 `bd331e21b2849dafed0d47fc30ad05b5788ff205617fb350d641a507278c2488` |
| `npm run lint` | 0 | No ESLint errors or warnings; SHA-256 `11c09a5b91a7282a2336c71f806c30f269edc9f0041113826e8bd2f6946d65f4` |
| `npm run format:check` | 0 | All matched files use Prettier style; SHA-256 `7964eb49639891ed1e93e7b11ad00c3656657ef0a0441d4a7e773e4d97ae2f8d` |
| `npm pack --dry-run` | 0 | Package dry run listed 28 files; SHA-256 `2262855be25f26455ab37645007d24b8486cf706484d298af377fac456f7171a` |
| `cmd.exe /d /s /c "(npm run lint && npm run format:check && npm pack --dry-run)"` | 0 | Combined build/quality evidence passed; SHA-256 `63b3417eaac2c355730b6974ae0d4c1ad4f8dd000c7c29b94bb13abdf6507067` |
| `node bin/backup.js --help` | 0 | Usage printed; SHA-256 `0332f15aa1eae9794cb88e08c363385419c7767e2b6fad1debaf99e578522044` |
| `node bin/backup.js --version` | 0 | Printed `1.0.0`; SHA-256 `59854984853104df5c353e2f681a15fc7924742f9a2e468c29af248dce45ce03` |
| Inject `apiBatchSize: 0` into defaults and execute `backup.main([])` | 1 (expected) | Printed `Error: apiBatchSize must be an integer between 1 and 100`; SHA-256 `eb2096046cfe2658313a7c9b9467717473d1499c5e6e2c2f1af8716015d160ff` |
| Bounded Node inspection of engines, CI matrix, Node 18 exclusion, Chromium installation, and command order | 0 | Printed `CI_CONFIG_OK`; SHA-256 `cda4f9ced2b182e33cfba890040ff7ca8611cb84d954a8ffa1cbc678645f9f55` |

**Coverage**: Not available. No coverage command or threshold is configured.

### Spec Compliance Matrix

| Requirement | Scenario | Test | Result |
|---|---|---|---|
| R1–R4 | Supported Node.js baseline | `test/tooling-context.test.js > pins the supported Node toolchain and CI matrix`, full suite, and bounded CI/config inspection | ✅ COMPLIANT |
| R5 | Invalid `maxRetries` | `test/config.test.js > rejects a non-positive maxRetries` | ✅ COMPLIANT |
| R10, R12 | Config mutation blocked | `test/config.test.js > returns a frozen config object with defaults` and `test/cli.test.js > returns a config with resolved backupDir and profileDir overrides` | ✅ COMPLIANT |
| R13 | Friendly CLI error | `test/cli.test.js > backup.js prints a friendly config error and exits 1`, plus the bounded injected runtime check | ✅ COMPLIANT |

**Compliance summary**: 4/4 scenarios compliant at runtime.

### Correctness (Static Evidence)

| Requirement | Status | Notes |
|---|---|---|
| R1 — Install Playwright Chromium in CI | ✅ Implemented | CI runs `npx playwright install chromium` after `npm ci` and before `npm test`. |
| R2 — Declare supported Node.js engines | ✅ Implemented | `package.json` declares `^20.19.0 || ^22.13.0 || >=24`. |
| R3 — Run CI on supported release lines | ✅ Implemented | CI matrix contains `20.x`, `22.x`, and `24.x`. |
| R4 — Exclude unsupported Node 18 | ✅ Implemented | Node 18 is absent from engines and CI. |
| R5 — Reject invalid maxRetries | ✅ Implemented | Positive-integer validation and passing focused tests are present. |
| R6 — Reject invalid maxRedirects | ✅ Implemented | Positive-integer validation and passing focused tests are present. |
| R7 — Reject invalid retryDelayMs | ✅ Implemented | Finite non-negative validation and passing focused tests are present. |
| R8 — Reject invalid jitterMaxMs | ✅ Implemented | Finite non-negative validation and passing focused tests are present. |
| R9 — Preserve existing config validation | ✅ Implemented | Existing path, API batch, delay, and timeout validations remain and pass. |
| R10 — Return frozen loaded configuration | ✅ Implemented | `loadConfig()` returns `Object.freeze(cfg)`. |
| R11 — Apply overrides without mutating defaults | ✅ Implemented | Both factory and CLI merge create new objects; focused tests confirm defaults remain unchanged. |
| R12 — Block loaded config mutation | ✅ Implemented | Frozen behavior is asserted with `Object.isFrozen`. |
| R13 — Print friendly ConfigError output | ✅ Implemented | `ConfigError` prints one `Error: <message>` line and exits 1. |
| R14 — Preserve non-ConfigError diagnostics | ✅ Implemented | `handleFatalError` prints `error.stack || error.message`; both paths pass tests. |

### Coherence (Design)

| Decision | Followed? | Notes |
|---|---|---|
| Modern Node baseline and Playwright Chromium in CI | ✅ Yes | Engines, three-version matrix, install step, and ordering match the design. |
| Complete config validation | ✅ Yes | All four downloader tunables have the specified guards and focused tests. |
| Immutable config factory | ✅ Yes | `loadConfig` and CLI override application return frozen copies without mutating defaults. |
| Friendly CLI errors | ✅ Yes | Expected config errors are concise; unexpected errors retain stack/message diagnostics. |

### Issues Found

**CRITICAL**: None.
**WARNING**: None.
**SUGGESTION**: None.

### Verdict

**PASS**

All 14 requirements and all 4 scenarios are implemented and supported by passing runtime evidence. The full suite, focused tests, lint, formatting, package dry run, CLI checks, and bounded CI/config inspection passed in Standard mode.
