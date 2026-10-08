# Contributing to discord-channel-dump

Thanks for taking the time to contribute. This is the single source for contributor setup, checks, conventions, and the pull request workflow. For usage, see [README.md](README.md); for a project map aimed at agents, see [AGENTS.md](AGENTS.md).

## Quick path

1. Set up the project (see [Setup](#setup)).
2. Open an issue and wait for `status:approved` (see [Submitting changes](#submitting-changes)).
3. Make a focused change on a branch.
4. Run the checks: `npm run lint`, `npm run format:check`, `npm test`.
5. Open a pull request with the template.

## Setup

1. Install Node.js `^20.19.0`, `^22.13.0`, or `>=24`.
2. Install dependencies and Playwright's Chromium browser:

   ```bash
   npm install
   npx playwright install chromium
   ```

## Running checks

```bash
npm run lint
npm run format:check
npm test
```

To auto-format code:

```bash
npm run format
```

CI (`.github/workflows/ci.yml`) runs the same checks on every supported Node.js line.

## Project conventions

- **CommonJS**: use `require` / `module.exports` (no ES modules).
- **Layout**: CLI entry points live in `bin/`; runtime logic lives in `src/`.
- **Config single source of truth**: keep tunables in `src/config.js`.
- **Path handling**: use `path.join` / `path.resolve` for filesystem paths; use `path.posix.join` only for URL-style relative paths in HTML.
- **Interactive by default**: the interactive backup flow is the default; CLI arguments are optional overrides.
- **Runtime directories**: `backups/` and `browser-profile/` are created at runtime and must not be deleted or committed. They are preserved by the project tooling.
- **Formatting**: text files use LF line endings; Prettier checks formatting.
- **Specs**: behavior specs live in `openspec/`; see [openspec/README.md](openspec/README.md).

## Submitting changes

Every pull request starts from an approved issue. The `PR Validation` workflow (`.github/workflows/pr-validation.yml`) blocks pull requests that skip these steps.

### Steps

1. **Open an issue** with the "Work item" template. New issues get the `status:needs-review` label.
2. **Wait for approval.** A maintainer adds `status:approved` when the work can start. Do not start before that.
3. **Branch and commit** using [Conventional Commits](https://www.conventionalcommits.org/) (for example, `fix(media): ...` or `docs: ...`). Do not add attribution trailers.
4. **Run the checks**: `npm run lint`, `npm run format:check`, and `npm test`.
5. **Open the pull request** with the template in `.github/PULL_REQUEST_TEMPLATE.md`.

### Pull request rules (enforced by CI)

| Rule | Requirement |
|------|-------------|
| Linked issue | The PR body contains exactly one `Closes #N`, `Fixes #N`, or `Resolves #N`, and it points to an issue in this repository. |
| Issue approval | The linked issue has the `status:approved` label. |
| Type label | The PR has exactly one `type:*` label from this list: `type:bug`, `type:feature`, `type:docs`, `type:refactor`, `type:chore`, `type:breaking-change`. |

### Repository conventions

- Keep changes focused on one concern per pull request.
- Avoid adding new runtime dependencies unless there is a design discussion first.
- Add user-visible changes to the `[Unreleased]` section of `CHANGELOG.md`.
- Update docs (`README.md`, `README.es.md`, `CHANGELOG.md`, `CONTRIBUTING.md`, `AGENTS.md`) when behavior or structure changes.
- **New test files**: add each new file to both the `test` and `test:watch` scripts in `package.json`. Both scripts list test files explicitly, so a file that is not listed does not run.

## Language

| Area | Language |
|------|----------|
| Code, comments, documentation, commits, issues, and pull requests | English |
| End-user interface (the offline viewer) | Spanish |
| `README.es.md` | Spanish translation of `README.md` |

`README.md` is the source of truth. When you change it, update `README.es.md` too when practical.

## License

By contributing, you agree that your contributions will be licensed under the MIT License.
