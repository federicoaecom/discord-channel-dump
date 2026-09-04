# Changelog

All notable changes to this project will be documented in this file.

## [Unreleased]

## [2.0.0] - 2026-09-04

### BREAKING CHANGES

- Removed Node.js 18 support. Version 2.0.0 requires Node.js `^20.19.0`, `^22.13.0`, or `>=24`.

### Added

- Added `--verbose` diagnostics while keeping routine output concise.

### Changed

- Made package metadata authoritative for CLI and interactive version output.
- Updated CI to exercise the exact Node.js 20.19.0 and 22.13.0 support floors plus Node.js 24.
- Added deterministic SHA-256 URL suffixes to downloaded media filenames for stable reuse and collision resistance.

### Fixed

- Confined channel output to validated backup subdirectories, including traversal and Windows reserved-name defenses.
- Preserved fatal configuration diagnostics and immutable resolved configuration.
- Hardened executable packaging, installed CLI smoke coverage, and interrupt cleanup verification.

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

[2.0.0]: https://github.com/federicoaecom/discord-channel-dump/compare/v1.0.0...v2.0.0
[1.0.0]: https://github.com/federicoaecom/discord-channel-dump/releases/tag/v1.0.0
