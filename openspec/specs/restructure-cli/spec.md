# Restructure CLI Specification

## Purpose

Reorganize the project into an idiomatic Node.js CLI layout: executable entry points in `bin/`, library modules in `src/`, templates in `src/templates/`, and test helpers in `test/helpers/`.

## Requirements

### Requirement: CLI Entries Moved to bin/

The system MUST move `backup.js` and `regen-html.js` to the `bin/` directory.

#### Scenario: CLI entries are in the workspace root

- GIVEN `backup.js` and `regen-html.js` exist in the workspace root
- WHEN the restructure capability is applied
- THEN `bin/backup.js` and `bin/regen-html.js` exist
- AND the root copies no longer exist

#### Scenario: Running CLI from new paths

- GIVEN `bin/backup.js` and `bin/regen-html.js` are in place
- WHEN `node bin/backup.js --help` and `node bin/regen-html.js --help` are executed
- THEN each command prints usage and exits with code 0

### Requirement: Library Modules Moved to src/

The system MUST move `config.js`, `utils.js`, `downloader.js`, and `cancel-token.js` to the `src/` directory.

#### Scenario: Library modules are in the workspace root

- GIVEN `config.js`, `utils.js`, `downloader.js`, and `cancel-token.js` exist in the workspace root
- WHEN the restructure capability is applied
- THEN those files exist under `src/`
- AND the root copies no longer exist

### Requirement: Viewer Template Moved to src/templates/

The system MUST move `templates/viewer.html` to `src/templates/viewer.html`.

#### Scenario: Template is in the legacy templates directory

- GIVEN `templates/viewer.html` exists
- WHEN the restructure capability is applied
- THEN `src/templates/viewer.html` exists
- AND the `templates/` directory is removed

### Requirement: Test Helper Moved to test/helpers/

The system MUST move `scripts/run-interrupt.js` to `test/helpers/run-interrupt.js`.

#### Scenario: Interrupt helper is under scripts/

- GIVEN `scripts/run-interrupt.js` exists
- WHEN the restructure capability is applied
- THEN `test/helpers/run-interrupt.js` exists
- AND the `scripts/` directory is removed

### Requirement: Internal require Paths Updated

The system MUST update all `require()` paths in `bin/`, `src/`, and `test/` so modules resolve from their new locations.

#### Scenario: Module imports after restructure

- GIVEN library modules are in `src/` and CLI entries are in `bin/`
- WHEN the project is loaded or executed
- THEN no "Cannot find module" errors occur for internal dependencies

### Requirement: Config Defaults Updated for New Layout

The system MUST update `src/config.js` so that default `backupDir` and `profileDir` still resolve to the project root.

#### Scenario: Default config paths from src/

- GIVEN `src/config.js` is loaded
- WHEN default paths are inspected
- THEN `backupDir` resolves to `<project-root>/backups`
- AND `profileDir` resolves to `<project-root>/browser-profile`

### Requirement: Template Path Updated in utils.js

The system MUST update `src/utils.js` so that `generateHtml` loads the template from `src/templates/viewer.html`.

#### Scenario: HTML generation after template move

- GIVEN `src/templates/viewer.html` exists
- WHEN `generateHtml` is called with any channel name and message list
- THEN it produces HTML without unresolved `{{...}}` placeholders
- AND it does not throw a file-not-found error

### Requirement: Test Imports Updated

The system MUST update all test files to import modules from their new locations (`../src/` or `../bin/`).

#### Scenario: Test suite after restructure

- GIVEN all tests have been updated with new import paths
- WHEN `npm test` is run
- THEN the test suite completes successfully with no import errors

### Requirement: No Functional Changes

The system MUST preserve the existing behavior of all modules; only file locations and relative paths SHALL change.

#### Scenario: Backup logic remains unchanged

- GIVEN the restructure is complete
- WHEN `backup.parseCliArgs` and `backup.applyOverrides` are exercised with the same inputs as before
- THEN the outputs match the pre-restructure behavior
