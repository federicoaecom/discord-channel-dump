# Spec: Refactor CLI Entry Point

## ID

`refactor-cli-entry`

## Summary

`bin/backup.js` MUST be reduced to a thin CLI entry point. All CLI parsing, help/version output, and argument validation MUST move to a dedicated module.

## Requirements

### R1: CLI module exists

`src/cli/backup-args.js` MUST exist and export `parseCliArgs`, `printHelp`, and `printVersion`.

### R2: Argument parsing behavior is preserved

`parseCliArgs(argv)` MUST:

- Recognize `--help` / `-h`.
- Recognize `--version` / `-v`.
- Recognize `--output` / `-o` followed by a value.
- Recognize `--profile` / `-p` followed by a value.
- Return an object with `help`, `version`, `output`, `profile`, and optionally `error`.
- Return an `error` property for unknown options or unexpected arguments.
- Return an `error` property when a flag that requires a value is missing it.

### R3: Help and version output are preserved

`printHelp()` MUST print the same usage text as the current `bin/backup.js`.

`printVersion()` MUST print the version from `package.json`.

### R4: Entry point is thin

`bin/backup.js` MUST:

- Parse CLI arguments using `src/cli/backup-args.js`.
- Apply config overrides.
- Validate the config.
- Call `src/app.js` to run the interactive session.
- Contain no message-fetching, download-orchestration, or prompt logic.

## Scenarios

### S1: Help request

**Given** the user runs `node bin/backup.js --help`  
**When** the CLI module parses the arguments  
**Then** it prints usage and exits 0.

### S2: Unknown option

**Given** the user runs `node bin/backup.js --foo`  
**When** the CLI module parses the arguments  
**Then** it prints an error and exits 1.

### S3: Missing value

**Given** the user runs `node bin/backup.js --output`  
**When** the CLI module parses the arguments  
**Then** it prints an error and exits 1.

### S4: Entry point delegates to app module

**Given** valid CLI arguments  
**When** `bin/backup.js` finishes parsing  
**Then** it calls `src/app.js` and does not inline the interactive loop.

## Notes

- This spec is part of the larger `refactor-backup-js-api-security` change.
- Existing CLI smoke tests will be updated to import from `src/cli/backup-args.js`.
