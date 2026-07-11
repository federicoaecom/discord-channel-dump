# Cross-Platform CLI Specification

## Purpose
Define a portable CLI interface that preserves the interactive flow.

## Requirements

### Requirement: Help and version flags
`bin/backup.js` MUST support `--help` and `--version` and print useful information.

#### Scenario: Help flag
- GIVEN the user runs `node bin/backup.js --help`
- THEN the terminal prints usage, available options, and examples

#### Scenario: Version flag
- GIVEN the user runs `node bin/backup.js --version`
- THEN the terminal prints the version from `package.json`

### Requirement: Default interactive flow
Running `bin/backup.js` without arguments MUST keep the existing interactive workflow unchanged.

#### Scenario: No arguments
- GIVEN the user runs `node bin/backup.js`
- THEN the browser opens and the terminal prompts for ENTER or exit

### Requirement: Optional CLI arguments
The CLI SHOULD accept optional arguments to override `backupDir` and `profileDir`.

#### Scenario: Override output directory
- GIVEN the user runs `node bin/backup.js --output ./my-backups`
- THEN backups are written to `./my-backups`

### Requirement: Cross-platform path handling
Path construction MUST use `path.join` or equivalent and avoid hardcoded separators.

#### Scenario: Windows path
- GIVEN the tool runs on Windows
- WHEN it creates `backups/channel/images`
- THEN the path uses the correct OS separator

### Requirement: Error and usage copy
The CLI MUST print clear error messages and usage hints on invalid input.

#### Scenario: Unknown flag
- GIVEN the user runs `node bin/backup.js --unknown`
- THEN the tool prints an error and a short usage hint
