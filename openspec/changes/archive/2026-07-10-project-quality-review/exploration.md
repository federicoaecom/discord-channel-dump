# Exploration: Project Quality & Production Readiness Review

> Deep review of the `DISCORD-BACKUP` project across documentation, structure, terminal UX, architecture, and production-readiness gaps. This exploration identifies what is missing and recommends a scoped, formal SDD change.

---

## Current State

The project is a Node.js CommonJS CLI tool that backs up Discord text channels using Playwright. It uses an **API-first strategy** instead of DOM scrolling: a persistent Chromium context is opened, the user logs into Discord, the tool passively captures the user's `Authorization` token from browser API requests, and then calls Discord's `/api/v9/channels/{id}/messages` endpoint from within the page. It paginates backwards, normalizes messages, downloads images/attachments, and writes `messages.json` plus a self-contained offline `index.html` viewer.

- **Entry points:** `backup.js` (interactive backup) and `regen-html.js` (regenerate HTML from an existing `messages.json`).
- **Modules:** `config.js` (tunables + env overrides), `utils.js` (sanitization, directory helpers, HTML generation), `downloader.js` (HTTP/HTTPS download with timeout).
- **Dependencies:** `playwright@^1.45.0` only.
- **Quality tooling:** none. No tests, linter, formatter, type checker, or CI.
- **Documentation:** a Spanish `README.md` plus a `LICENSE` file. No `AGENTS.md`, `CONTRIBUTING.md`, or `CHANGELOG`.
- **Project metadata:** `package.json` is minimal; no `bin` entry, no `engines`, no `repository`, no `keywords`, no `author`, no `license` field.
- **CLI design:** entirely interactive (`readline` prompts). No argument parsing, no `--help`, no `--version`, no subcommands.
- **Codebase size:** ~700 LOC across 5 JS files. `backup.js` is the largest monolith (~370 LOC).

The tool works as-is, but it is not yet shaped like a maintainable, production-ready Node.js CLI.

---

## Affected Areas

| File/Area | Why it is affected |
|-----------|----------------------|
| `README.md` | Missing `AGENTS.md` convention (OpenCode expects uppercase `AGENTS.md`), no `CONTRIBUTING.md`, no `CHANGELOG`, mixed Spanish/English technical copy, and uses absolute `file://` links that break on other machines. |
| `package.json` | Missing `bin` entry means no global/local `npx` command; no `engines` field; no `repository`, `keywords`, `author`, or `license` metadata; scripts are limited. |
| `backup.js` | Interactive-only CLI with no CLI args, no `--help`, no structured error handling, plain `console.log` output, no progress bars, and a `SIGINT` handler that unconditionally exits with `0` even if work is in flight. |
| `utils.js` | `generateHtml` mixes HTML, CSS, inline JavaScript, and business logic in one large function. Hard to test, reuse, or theme. |
| `regen-html.js` | Minimal argument handling; no usage help, no path validation beyond `messages.json` existence, no exit codes on success path. |
| `config.js` | Only env vars and constants; no CLI-argument override, no validation of values, no schema. |
| `downloader.js` | Timeout logic is decent but there is no retry, no configurable user agent, and redirect handling clears/re-creates timers on each hop. |
| Missing `AGENTS.md` | OpenCode convention requires an uppercase `AGENTS.md` at the project root for agent context. |
| Missing tests/quality gates | No way to verify changes without running against live Discord. High regression risk. |

---

## Approaches

### 1. Lightweight docs-only cleanup

Add `AGENTS.md`, polish the `README.md` (consistent language, remove `file://` links), fix `package.json` metadata, and add a `LICENSE` field. No code changes.

- **Pros:** Fast, low risk, immediately improves agent onboarding and project metadata.
- **Cons:** Leaves CLI UX, architecture, and code-quality issues untouched.
- **Effort:** Low

### 2. Comprehensive production overhaul

Introduce a proper CLI parser (`commander` or `minimist`), `bin` entry, `--help` / `--version`, structured logging, progress bars, a template engine for HTML, unit/integration tests, ESLint/Prettier, GitHub Actions CI, `CONTRIBUTING.md`, `CHANGELOG.md`, and a typed configuration schema.

- **Pros:** Turns the project into a credible, distributable open-source CLI.
- **Cons:** Very large scope; high risk of breaking the current interactive flow; hard to review in one PR; requires many decisions.
- **Effort:** High

### 3. Targeted high-impact improvement (Recommended)

Create a formal change scoped to the biggest pain points with the smallest blast radius: add `AGENTS.md` and essential docs, improve `package.json` metadata, add `--help` and basic CLI argument handling, improve error messages and progress output, decouple the HTML template from `utils.js`, and add minimal test scaffolding. Keep the interactive workflow intact.

- **Pros:** Addresses the most important gaps for future agents and users without rewriting the tool; fits in a reviewable PR; can be delivered in small work units.
- **Cons:** Not fully production-grade; still lacks CI, lint, and comprehensive tests.
- **Effort:** Medium

---

## Recommendation

**Proceed with Approach 3 as a formal SDD change** named `project-quality-review` (or `cli-production-readiness`). The change should be split into clear, reviewable work units:

1. **Documentation** — create `AGENTS.md`, polish `README.md`, add `CHANGELOG.md` (or section), and optionally `CONTRIBUTING.md`.
2. **Package metadata** — add `bin`, `engines`, `license`, `repository`, `keywords`, and improve `scripts`.
3. **CLI UX** — add `--help`/`--version`, better usage messages, clearer error copy, and a graceful `SIGINT` path.
4. **Structure & architecture** — move the HTML template to a separate file/template function, reduce the monolith in `backup.js`, and validate config values.
5. **Quality scaffolding** — add at least one smoke test and a test runner so future changes can be verified without hitting Discord.

This scope is large enough to matter, small enough to review, and focused on the gaps that will hurt the next maintainer the most.

---

## Risks

- **Scope creep:** The review touches documentation, CLI design, architecture, and tooling. Without clear boundaries, the change can grow past a reviewable PR.
- **No test safety net:** There are no tests today, so refactors must be verified manually or with new tests, which adds effort.
- **Breaking the interactive workflow:** Adding CLI arguments could accidentally change the default user experience if not done carefully.
- **Playwright compatibility:** The project pins `^1.45.0`. Any structural changes should be tested against the installed version to avoid browser-launch regressions.
- **Windows-centric paths:** The codebase uses `path.join` correctly in most places, but the `README.md` examples use backslashes and `file://` paths that may not translate to other environments.

---

## Ready for Proposal

**Yes.** The project has clear, well-defined gaps that justify a formal SDD change. A `project-quality-review` change should be proposed with a scoped intent: *improve documentation, package metadata, CLI usability, and structural quality while preserving the existing interactive backup workflow*. The orchestrator should ask the user whether to prioritize docs/CLI first, or whether to include test/quality scaffolding in the same change.
