# Agent Onboarding

This document helps future agents (and humans) get oriented in the `discord-channel-dump` project. Contributor setup, checks, conventions, and the PR workflow live in [CONTRIBUTING.md](CONTRIBUTING.md). User-facing usage lives in [README.md](README.md).

## Project

- **Name**: `discord-channel-dump`
- **Purpose**: Back up Discord text channels via Playwright browser automation.
- **License**: MIT (see `LICENSE`)

## Stack

- **Runtime**: Node.js 20.19+, 22.13+, or 24+
- **Language**: JavaScript (CommonJS), npm
- **Browser automation**: Playwright 1.62.1
- **Tests**: Node.js built-in `node:test`
- **Quality**: ESLint and Prettier
- **CI**: GitHub Actions

## File Structure

```
.
├── .github/
│   ├── workflows/          # ci.yml (checks, tests, pack smoke), pr-validation.yml
│   ├── ISSUE_TEMPLATE/     # Work item template and config
│   └── PULL_REQUEST_TEMPLATE.md
├── bin/
│   ├── backup.js           # Main CLI / interactive backup entry point
│   └── regen-html.js       # Regenerate index.html for an existing backup folder
├── src/
│   ├── api/discord.js      # Discord REST API calls from the Node context
│   ├── browser/session.js  # Browser launch, token capture, DOM helpers
│   ├── cli/backup-args.js  # CLI argument parsing and help/version output
│   ├── messages/normalize.js # Message normalization from Discord API format
│   ├── output/writer.js    # Channel output writing and download orchestration
│   ├── ui/                 # prompt, colors, progress, logger
│   ├── utils/              # sanitize, html, filenames, icons, fs
│   ├── viewer/render.js    # Offline viewer HTML generation
│   ├── templates/viewer.html # Offline viewer template
│   ├── app.js              # Interactive backup orchestration
│   ├── config.js           # Tunables and config validation
│   ├── utils.js            # Backwards-compatible barrel for utils/
│   ├── downloader.js       # File downloader with hard timeouts
│   └── cancel-token.js     # Shared cancellation primitive
├── test/
│   ├── <area>/             # Unit tests mirroring src/ (api, browser, cli, ...)
│   ├── helpers/            # Shared fixtures and subprocess helpers
│   └── *.test.js           # Cross-cutting tests (e.g. CLI, layout, tooling)
├── openspec/               # Specs and archived changes (see openspec/README.md)
├── eslint.config.js        # ESLint flat config
├── .prettierrc / .prettierignore
├── .gitattributes          # Line-ending rules
├── .gitignore / .npmignore
├── package.json / package-lock.json
├── README.md / README.es.md # User docs (English / Spanish)
├── CONTRIBUTING.md         # Contributor setup, checks, PR workflow
├── CHANGELOG.md
├── AGENTS.md               # This file
├── LICENSE
├── backups/                # Runtime output (untracked, preserved)
└── browser-profile/        # Runtime browser profile (untracked, preserved)
```

## How to Run

Install dependencies first (see [CONTRIBUTING.md](CONTRIBUTING.md#setup)).

```bash
node bin/backup.js                       # Interactive backup
node bin/backup.js --output ./my-backups --profile ./my-profile
node bin/backup.js --dry-run             # Count messages without saving files
node bin/backup.js --verbose             # Debug output
node bin/regen-html.js backups/channel-name  # Rebuild index.html for a backup
```

Run either script with `--help` for the full option list.

## Verify

```bash
npm run lint
npm run format:check
npm test
```

## Key Conventions

- CommonJS only; tunables live in `src/config.js`.
- The interactive flow is the default; CLI arguments are optional overrides.
- `backups/` and `browser-profile/` are preserved runtime directories: never remove or commit them.
- New test files must be added to the `test` and `test:watch` scripts in `package.json`.
- Code, docs, commits, issues, and PRs are in English; the end-user interface is in Spanish. See [Language](CONTRIBUTING.md#language).
- Full rules: [CONTRIBUTING.md](CONTRIBUTING.md).

## Specs

Behavior specs and the change workflow live in `openspec/`. Start with [openspec/README.md](openspec/README.md).
