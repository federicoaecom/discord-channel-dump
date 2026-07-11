# CLI Smoke Tests Specification

## Purpose
Verify that the CLI entry points `backup.js` and `regen-html.js` can start, respond to `--help` and `--version`, and exit cleanly without launching a browser session.

## Requirements

### Requirement: Backup CLI Help

`node backup.js --help` MUST print usage information to stdout and exit with code `0`.

#### Scenario: Help output

- GIVEN a working Node.js environment and installed dependencies
- WHEN `node backup.js --help` runs via `child_process`
- THEN stdout contains `"Usage:"`
- AND the process exits with code `0`

### Requirement: Backup CLI Version

`node backup.js --version` MUST print the package version from `package.json` and exit with code `0`.

#### Scenario: Version output

- GIVEN `package.json` has a valid `version` field
- WHEN `node backup.js --version` runs via `child_process`
- THEN stdout equals the package version followed by a newline
- AND the process exits with code `0`

### Requirement: Regenerate CLI Help

`node regen-html.js --help` MUST print usage information to stdout and exit with code `0`.

#### Scenario: Help output

- GIVEN a working Node.js environment
- WHEN `node regen-html.js --help` runs via `child_process`
- THEN stdout contains `"Usage:"`
- AND the process exits with code `0`

### Requirement: Regenerate CLI Version

`node regen-html.js --version` MUST print the package version and exit with code `0`.

#### Scenario: Version output

- GIVEN `package.json` has a valid `version` field
- WHEN `node regen-html.js --version` runs via `child_process`
- THEN stdout equals the package version followed by a newline
- AND the process exits with code `0`

### Requirement: No Browser Side Effects

Smoke tests for `--help` and `--version` MUST NOT open a browser or start a Discord session.

#### Scenario: Process does not hang

- GIVEN the CLI is invoked with `--help`
- WHEN the process exits
- THEN no Playwright browser process remains running
- AND the command completes within a reasonable timeout
