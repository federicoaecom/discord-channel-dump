# Proposal: Project Quality Review

## Intent

The project works but lacks production-ready documentation, package metadata, CLI conventions, and structural separation. This change improves those areas while keeping the existing interactive backup flow intact.

## Scope

### In Scope
- Create `AGENTS.md` (OpenCode convention) and improve `README.md`.
- Improve `package.json` metadata (`bin`, `engines`, `license`, `repository`, `keywords`, scripts).
- Add `--help`, `--version`, and optional CLI arguments.
- Fix cross-platform path handling for Windows, macOS, and Linux.
- Improve error and usage copy.
- Separate the HTML template from `utils.js`.
- Reduce the monolith in `backup.js` and add basic config validation.

### Out of Scope
- Testing framework and scaffolding (separate change).
- CI/CD, linting, formatting, or type checking.
- New features such as progress bars, structured logging, or a templating engine.

## Capabilities

### New Capabilities
- `agent-onboarding`: `AGENTS.md`, README improvements, and project docs for future agents.
- `package-metadata`: `package.json` improvements (`bin`, `engines`, `license`, `repository`, `keywords`, scripts).
- `cross-platform-cli`: argument parsing, `--help`, `--version`, cross-platform path handling, better error/usage copy.
- `structural-quality`: separate HTML template from logic, reduce `backup.js` monolith, basic config validation.

### Modified Capabilities
- None.

## Approach

Apply the targeted improvement approach from the exploration: keep the interactive flow as the default, layer optional CLI arguments on top, use minimal dependencies, and extract the HTML template into a dedicated file. Use `path.join`/`path.sep` consistently and validate `config.js` values at startup.

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `AGENTS.md` | New | OpenCode agent onboarding document. |
| `README.md` | Modified | Cross-platform examples, consistent English, remove `file://` links. |
| `package.json` | Modified | Add `bin`, `engines`, `license`, `repository`, `keywords`, scripts. |
| `backup.js` | Modified | CLI args, `--help`/`--version`, better errors, smaller functions. |
| `regen-html.js` | Modified | Usage help, exit codes, cross-platform examples. |
| `config.js` | Modified | Validate tunables. |
| `utils.js` | Modified | Extract HTML template; keep helpers. |
| `templates/viewer.html` | New | External HTML template file. |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Scope creep | Med | Defer tests, CI, and new features to later changes. |
| Break interactive flow | Med | Keep no-arg behavior unchanged; use optional args only. |
| Cross-platform path bugs | Low | Use `path.join` everywhere; verify on target OS paths. |

## Rollback Plan

Revert all changed files via git. If the new CLI argument parsing breaks the default flow, restore the previous `backup.js` and run `node backup.js` in interactive mode.

## Dependencies

- None external. Prefer native `process.argv` or a lightweight parser if needed.

## Success Criteria

- [ ] `node backup.js --help` and `node backup.js --version` print useful output.
- [ ] `node backup.js` with no arguments still opens the interactive flow.
- [ ] `AGENTS.md` exists at repo root.
- [ ] `package.json` includes `bin`, `engines`, `license`, `repository`, and `keywords`.
- [ ] `README.md` examples use cross-platform path notation.
- [ ] `utils.js` no longer contains the full HTML template string.
- [ ] `config.js` rejects invalid values at startup.
- [ ] Changes work on Windows, macOS, and Linux.
