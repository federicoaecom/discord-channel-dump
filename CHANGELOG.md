# Changelog

All notable changes to this project will be documented in this file.

## [Unreleased]

### Changed

- Raised the minimum Node.js versions to `^20.19.0`, `^22.13.0`, or `>=24`.

## [1.0.0] - 2026-07-11

### Added

- **Modular `src/` architecture**: decoupled CLI, browser session, Discord API, message normalization, output writing, and viewer rendering into focused modules.
- **Offline viewer**: generated `index.html` with search, date range filtering, and media layout.
- **Security hardening**: CSP-friendly inline viewer, `noopener noreferrer` external links, and URL-safe filenames.
- **Terminal UX**: ANSI colors with `NO_COLOR` support and a progress bar for media downloads.
- **Configuration validation**: `validateConfig()` and `loadConfig()` for tunables with friendly error messages.
- **CI with GitHub Actions**: lint, format, and tests including Playwright browser installation.
- **Dry-run mode**: `--dry-run` fetches message counts without writing files.
- **Graceful shutdown**: SIGINT/SIGTERM cleanup waits for browser context closure and removes partial downloads.

### Changed

- Project layout moved from flat scripts to `src/` and `bin/`.

[1.0.0]: https://github.com/federicoaecom/discord-channel-dump/releases/tag/v1.0.0
