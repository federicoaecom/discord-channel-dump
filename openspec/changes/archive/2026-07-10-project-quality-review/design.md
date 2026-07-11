# Design: Project Quality Review

## Technical Approach

Layer a minimal, native CLI argument parser on top of the existing interactive backup flow, then extract the HTML viewer template into a dedicated file and split `backup.js` into smaller, focused functions. Validate `config.js` values at startup, fix cross-platform path construction, and update package metadata and agent/user documentation. No new runtime dependencies are introduced.

## Architecture Decisions

| Decision | Choice | Alternatives | Rationale |
|---|---|---|---|
| CLI parsing | Small `parseCliArgs` helper in `backup.js` using `process.argv` | `commander`, `minimist`, or a new `cli.js` module | Keeps the project dependency-free; covers `--help`, `--version`, and optional overrides only. |
| HTML template | Move template to `templates/viewer.html`; replace tokens at runtime | Keep template in `utils.js`, or add a templating engine | Separates presentation from logic without adding dependencies. |
| Config validation | `validateConfig(c)` exported from `config.js`; called after CLI overrides | Validate inside `backup.js` | `config.js` remains the single source of truth for tunables. |
| `backup.js` size | Decompose into focused functions: `parseCliArgs`, `printHelp`, `printVersion`, `runBrowserSession`, `captureLoop`, `processChannel` | Split into many new modules | Improves readability while preserving the current module structure. |
| Path handling | Use `path.join`, `path.resolve`, `__dirname`, and `path.posix.basename` for URLs only | Hardcoded `/` or `\\` separators | Guarantees correct behavior on Windows, macOS, and Linux. |
| Package metadata | Add `bin`, `engines`, `license`, `repository`, `keywords` to `package.json` | Leave metadata minimal | Makes the tool installable and discoverable. |

## Data Flow

```
process.argv
    |
    v
parseCliArgs() -> help/version -> stdout -> exit 0
    |
    v
applyOverrides(config) -> validateConfig(config)
    |
    v
ensureDir(backupDir, profileDir)
    |
    v
launchPersistentContext(profileDir) -> token capture -> Discord
    |
    v
captureLoop() -> processChannel(channelId, channelName)
    |
    v
fetchAllMessages() -> normalizeMessage() -> downloadMedia()
    |
    v
write messages.json + index.html
```

## File Changes

| File | Action | Description |
|---|---|---|
| `AGENTS.md` | Create | OpenCode agent onboarding document with stack, file structure, and run instructions. |
| `README.md` | Modify | Rewrite in consistent English; use cross-platform path examples; replace `file://` links with relative links. |
| `package.json` | Modify | Add `bin`, `engines`, `license`, `repository`, `keywords`; keep existing scripts. |
| `backup.js` | Modify | Add CLI arg parsing, `--help`/`--version`, clearer error/usage copy, smaller functions, and cross-platform paths. |
| `regen-html.js` | Modify | Add usage help, exit codes, and cross-platform examples. |
| `config.js` | Modify | Export defaults and a `validateConfig` function. |
| `utils.js` | Modify | Remove the embedded HTML template; load it from `templates/viewer.html`; keep helpers. |
| `templates/viewer.html` | Create | Standalone HTML template with replaceable tokens (`{{CHANNEL_NAME}}`, `{{ROWS}}`, etc.). |

## Interfaces / Contracts

### CLI argument parser

```js
function parseCliArgs(argv) {
  // Returns: { help: boolean, version: boolean, output?: string, profile?: string, error?: string }
}
```

### Config validation

```js
function validateConfig(config) {
  // Throws ConfigError with a clear message if apiBatchSize <= 0, apiDelayMs < 0,
  // downloadTimeoutMs <= 0, or required directories are missing/invalid.
}
```

### HTML generation

```js
function generateHtml(channelName, messages) {
  // Reads templates/viewer.html, substitutes tokens, and returns the final HTML string.
}
```

Path construction must use `path.join(__dirname, "templates", "viewer.html")` and never string concatenation with separators.

## Testing Strategy

No test runner exists yet, so verification is manual for this change. Automated tests will be added in a follow-up change.

| Layer | What to Test | Approach |
|---|---|---|
| Manual CLI | `--help`, `--version`, no arguments, `--output ./tmp`, `--profile ./tmp-profile`, unknown flags | Run `node backup.js` with each case and inspect output/exit code. |
| Manual config | Invalid `apiBatchSize`/`apiDelayMs`/`downloadTimeoutMs` | Temporarily edit `config.js` and verify a clear error and non-zero exit. |
| Manual cross-platform paths | Backup and profile directories on the current OS | Run the tool and confirm directories are created with the correct OS separators. |
| Manual HTML regen | `node regen-html.js --help` and `node regen-html.js <backup-folder>` | Verify `index.html` is regenerated and the template file is read. |
| Manual docs | `AGENTS.md` presence, README links, `package.json` fields | Inspect files directly. |

## Threat Matrix

| Boundary | Minimum adversarial cases | Applicability | Design response | Planned RED tests |
|---|---|---|---|---|
| Documentation-like paths | `README.sh`, executable MDX | N/A: no executable documentation files are introduced or classified. | — | — |
| Git repository selection | `git -C`, relative/absolute paths | N/A: no Git automation is added. | — | — |
| Commit state | staged, `commit -a`, empty index | N/A: no VCS commit automation is added. | — | — |
| Push state | tracking branch, first push, explicit refspec | N/A: no push automation is added. | — | — |
| PR commands | explicit `--head`, environment prefix, composed commands | N/A: no PR automation is added. | — | — |

The `bin` entry in `package.json` only points to the existing `backup.js` script; it does not introduce new executable-file classification logic or runtime execution boundaries.

## Migration / Rollout

No migration required. The default interactive flow remains unchanged when `backup.js` is run without arguments.

## Open Questions

- None.
