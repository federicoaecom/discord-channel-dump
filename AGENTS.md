# Agent Onboarding

This document helps future agents (and humans) get oriented in the `discord-channel-dump` project.

## Project

- **Name**: `discord-channel-dump`
- **Purpose**: Back up Discord text channels via Playwright browser automation.
- **License**: MIT (see `LICENSE`)

## Stack

- **Runtime**: Node.js 18+
- **Package manager**: npm
- **Language**: JavaScript (CommonJS)
- **Browser automation**: Playwright 1.45+
- **Tests**: Node.js built-in `node:test`
- **Quality**: ESLint and Prettier
- **CI**: GitHub Actions

## File Structure

```
.
├── bin/
│   ├── backup.js       # Main CLI / interactive backup entry point
│   └── regen-html.js   # Regenerate index.html for an existing backup folder
├── src/
│   ├── cli/            # CLI argument parsing and help/version output
│   │   └── backup-args.js
│   ├── api/            # Discord REST API calls from the Node context
│   │   └── discord.js
│   ├── browser/        # Browser launch, token capture, DOM helpers
│   │   └── session.js
│   ├── messages/       # Message normalization from Discord API format
│   │   └── normalize.js
│   ├── output/         # Channel output writing and download orchestration
│   │   └── writer.js
│   ├── ui/             # Terminal UX helpers (prompts, colors, progress bars)
│   │   ├── prompt.js
│   │   ├── colors.js
│   │   └── progress.js
│   ├── utils/          # Focused utility modules re-exported by utils.js
│   │   ├── sanitize.js
│   │   ├── html.js
│   │   ├── filenames.js
│   │   ├── icons.js
│   │   └── fs.js
│   ├── viewer/         # Offline viewer HTML generation
│   │   └── render.js
│   ├── app.js          # Interactive backup orchestration
│   ├── config.js       # Tunables and config validation
│   ├── utils.js        # Backwards-compatible barrel for utility modules
│   ├── downloader.js   # File downloader with hard timeouts
│   ├── cancel-token.js # Shared cancellation primitive
│   └── templates/
│       └── viewer.html # Offline viewer template
├── test/
│   ├── api/            # API module tests
│   ├── browser/        # Browser session tests
│   ├── cli/            # CLI parsing tests
│   ├── messages/       # Message normalization tests
│   ├── output/         # Output writer tests
│   ├── ui/             # UI prompt, color, and progress tests
│   ├── utils/          # Utility module tests
│   ├── viewer/         # Viewer render and template tests
│   └── helpers/        # Shared test fixtures and subprocess helpers
├── package.json        # Package metadata and scripts
├── README.md           # User-facing documentation
├── AGENTS.md           # This file
├── LICENSE             # MIT license
├── openspec/           # SDD / OpenSpec artifacts
├── backups/            # Preserved runtime output directory
└── browser-profile/    # Preserved runtime browser profile
```

## How to Run

1. Install dependencies:

   ```bash
   npm install
   npx playwright install chromium
   ```

2. Run the backup tool:

   ```bash
   node bin/backup.js
   ```

3. Optional CLI overrides:

   ```bash
   node bin/backup.js --output ./my-backups
   node bin/backup.js --profile ./my-profile --output ./my-backups
   ```

4. Regenerate HTML for an existing backup:

   ```bash
   node bin/regen-html.js backups/channel-name
   ```

## Conventions

- Use CommonJS (`require` / `module.exports`).
- Keep `config.js` as the single source of truth for tunables.
- Build filesystem paths with `path.join` / `path.resolve`; use `path.posix.join` only for URL-style relative paths in HTML.
- The interactive backup flow is the default; CLI arguments are optional overrides.
- Do not add new runtime dependencies without a design discussion.
- `backups/` and `browser-profile/` are preserved runtime directories and are never removed by source cleanup or restructuring.
