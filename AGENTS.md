# Agent Onboarding

This document helps future agents (and humans) get oriented in the `discord-channel-dump` project. Contributor setup, checks, conventions, and the PR workflow live in [CONTRIBUTING.md](CONTRIBUTING.md). User-facing usage lives in [README.md](README.md).

**Helping a person back up their Discord channels?** Read the next section and stop there. Everything after it is for contributors.

## If you are helping someone use this tool

Your goal is to help the person back up their channels. Do not modify the code, open pull requests, or follow the contributor sections below unless the person explicitly asks you to contribute.

### 1. Get the code

Default to the latest stable release. Use `main` only when the person explicitly asks for the development version.

- **Release ZIP (recommended)**: open `https://github.com/federicoaecom/discord-channel-dump/releases/latest` and download **Source code (zip)**. It extracts to a folder like `discord-channel-dump-2.1.0`; Windows "Extract All" can nest it one level deeper.
- **Git, release tag**: read the newest tag on `https://github.com/federicoaecom/discord-channel-dump/releases` (for example `v2.1.0`), then run `git clone --depth 1 --branch <tag> https://github.com/federicoaecom/discord-channel-dump.git`.
- **Development version, only on request**: `git clone https://github.com/federicoaecom/discord-channel-dump.git`, or **Code → Download ZIP** on GitHub.

Work from the folder that contains `package.json`. The person-facing steps for Node.js, download, and terminal are in [README: Before you start](README.md#before-you-start).

### 2. Commands you can run (or tell the person to run)

| Command | Purpose |
| --- | --- |
| `node --version` | Must satisfy `^20.19.0`, `^22.13.0`, or `>=24` (`engines` in `package.json`). |
| `npm install` | Installs dependencies. |
| `npx playwright install chromium` | Downloads the Chromium browser. It can take several minutes. |
| `node bin/backup.js --help` | Confirms the tool runs. Prints the options and exits. |

### 3. Steps only the person can do

`node bin/backup.js` is interactive: it opens a visible browser window and waits for keyboard input. Do not run it in your own shell, where it would just hang. Tell the person to run it in their own terminal, then:

1. Log in to Discord in the browser window. This is needed only on the first run; the session is saved.
2. Open the channel to back up.
3. Return to the terminal and press **ENTER**.
4. Press **ENTER** to confirm the detected channel name, or type another name.
5. Repeat steps 2 to 4 for more channels. Type `salir` or `exit` to finish.

Details: [README: Per-channel flow](README.md#per-channel-flow).

### Language

The interface is Spanish by default. For English, add `--lang en` or set `DISCORD_LANG=en` (in PowerShell: `$env:DISCORD_LANG = "en"`). See [README: Language](README.md#language).

### Result

Each channel is saved to `backups/<channel-name>/` (or under `--output <dir>`):

- `index.html`: offline viewer. Tell the person to open it in their browser.
- `messages.json`: every message, oldest first.
- `images/` and `attachments/`: downloaded media.

See [README: Output layout](README.md#output-layout).

### Safety rules

Respect these, and tell the person about the last two:

- Never ask for, print, or share the person's Discord password or token. They log in only in the browser window.
- Never read, print, copy, or share the contents of `browser-profile/`. It holds a live, logged-in Discord session and must be treated like a password. See [README: Security & Privacy](README.md#security--privacy).
- Backups contain private messages and attachments. Store and share them with the same care as the original conversations.
- Automating a user account may violate [Discord's Terms of Service](https://discord.com/terms); the person uses the tool at their own risk and should back up only content they have the right to keep. See [README: Disclaimer](README.md#disclaimer).

### Troubleshooting

Match the terminal message against [README: Troubleshooting](README.md#troubleshooting).

---

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
│   ├── cli/
│   │   ├── backup-args.js  # CLI argument parsing and help/version output
│   │   └── language.js     # --lang / DISCORD_LANG bootstrap shared by both bins
│   ├── i18n/
│   │   ├── index.js        # t(), language resolution, active language, date locales
│   │   ├── es.js           # Spanish dictionary (default language)
│   │   └── en.js           # English dictionary (also the fallback)
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
│   ├── <area>/             # Unit tests mirroring src/ (api, browser, cli, i18n, ...)
│   ├── cli/language.test.js # Language flag/env resolution in the CLI bootstrap
│   ├── i18n/index.test.js  # t(), resolution, and es/en key and placeholder parity
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
node bin/backup.js --lang en             # English interface (default: Spanish)
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
- Code, docs, commits, issues, and PRs are in English. The end-user interface (terminal output and the offline viewer) is Spanish by default and switchable to English with `--lang` or `DISCORD_LANG`. User-facing strings live in the dictionaries `src/i18n/es.js` and `src/i18n/en.js`, read through `t()`; `[debug]` lines stay English. See [Language](CONTRIBUTING.md#language).
- Full rules: [CONTRIBUTING.md](CONTRIBUTING.md).

## Specs

Behavior specs and the change workflow live in `openspec/`. Start with [openspec/README.md](openspec/README.md).
