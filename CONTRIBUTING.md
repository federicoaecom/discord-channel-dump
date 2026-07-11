# Contributing to discord-channel-dump

Thanks for taking the time to contribute. This document covers the basics of getting started and submitting changes.

## Setup

1. Install Node.js 18 or later.
2. Install dependencies and Playwright's Chromium browser:

   ```bash
   npm install
   npx playwright install chromium
   ```

## Project conventions

- **CommonJS**: use `require` / `module.exports` (no ES modules).
- **Layout**: CLI entry points live in `bin/`; runtime logic lives in `src/`.
- **Config single source of truth**: keep tunables in `src/config.js`.
- **Path handling**: use `path.join` / `path.resolve` for filesystem paths; use `path.posix.join` only for URL-style relative paths in HTML.
- **Runtime directories**: `backups/` and `browser-profile/` are created at runtime and must not be deleted or committed. They are preserved by the project tooling.

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

## Submitting changes

1. Make sure your branch passes `npm run lint`, `npm run format:check`, and `npm test`.
2. Keep changes focused on one concern per pull request.
3. Avoid adding new runtime dependencies unless there is a design discussion first.
4. Update docs (`README.md`, `CHANGELOG.md`, `CONTRIBUTING.md`) when behavior changes.

## License

By contributing, you agree that your contributions will be licensed under the MIT License.
