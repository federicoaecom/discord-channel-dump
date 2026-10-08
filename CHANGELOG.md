# Changelog

All notable changes to this project will be documented in this file.

## [Unreleased]

### Upgrade notes

- **Existing backups download their media again.** Media filenames changed in 2.0.0 (SHA-256 URL suffixes) and change again in this release: the suffix now comes from a canonical identity that ignores the rotating Discord CDN `ex`/`is`/`hm` parameters. Re-running a backup on an existing channel folder downloads its images and attachments again under the new names.
- **Old files stay on disk.** A re-run rewrites `messages.json` and `index.html` from the freshly fetched messages, so both reference only the new filenames. The tool never deletes files, so media saved under the old names remains in `images/` and `attachments/` but is no longer referenced.
- **Check before deleting old files.** A failed download (for example, an expired CDN link) leaves that message without a local copy in the new output, and messages deleted on Discord since the last run are no longer in `messages.json`. In both cases the old file may be the only copy. Keep a copy of the channel folder until the re-run reports `0 failed` for images and attachments and you have confirmed nothing you need is missing.
- Backups that you do not re-run keep working: their `messages.json` and `index.html` still reference the old filenames.
- **Terminal output is now Spanish by default.** Pass `--lang en` or set `DISCORD_LANG=en` for English. Scripts that parse the terminal output should set `DISCORD_LANG=en` to keep English output. The viewer language is fixed when `index.html` is written; regenerate an existing viewer with `bin/regen-html.js --lang <es|en>` to change it.

### Added

- Switchable Spanish/English interface: the `--lang <es|en>` flag, then the `DISCORD_LANG` environment variable, then Spanish as the default. An invalid `--lang` value exits with code 1.
- Localized offline viewer: page `lang` attribute, labels, message count, and date formatting (`es-AR` or `en-US`).
- `bin/regen-html.js --lang <es|en>` regenerates the viewer in the chosen language.
- `salir` quits the capture prompt, alongside `exit`, in either language.

### Changed

- Terminal output (help, prompts, progress, summaries, and API, download, and configuration errors) is now Spanish by default, and the offline viewer, previously always Spanish, follows the selected language. Skipped-download tags are `[omitido img]` / `[omitido adj]` in Spanish and `[skip img]` / `[skip att]` in English. `[debug]` lines stay in English.
- The viewer message count is pluralized ("1 mensaje", "2 mensajes" / "1 message", "2 messages").
- An invalid `DISCORD_LANG` value prints a warning and falls back to Spanish instead of failing.

### Fixed

- The viewer header no longer shows "1 msgs" for a single message.
- `bin/regen-html.js` no longer prints "(1 messages)" / "(1 mensajes)" for a single message.
- The end-of-backup summary is pluralized ("Saved 1 message" / "Se guardó 1 mensaje") and is now one complete sentence per language.
- The dry-run summary is pluralized ("would back up 1 message" / "se respaldaría 1 mensaje").
- Stabilized media filename identity: rotating Discord CDN `ex`/`is`/`hm` signatures reuse the same file, while meaningful query parameters keep resources distinct.

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

[Unreleased]: https://github.com/federicoaecom/discord-channel-dump/compare/v2.0.0...HEAD
[2.0.0]: https://github.com/federicoaecom/discord-channel-dump/compare/v1.0.0...v2.0.0
[1.0.0]: https://github.com/federicoaecom/discord-channel-dump/releases/tag/v1.0.0
