# Update Docs Context Specification

## Purpose

Refresh `README.md`, `AGENTS.md`, and `openspec/config.yaml` to reflect the new file structure, current tooling, and the user's decision that `backups/` and `browser-profile/` are runtime data directories.

## Requirements

### Requirement: README Commands Use New Paths

The system MUST update `README.md` so that all examples and commands use `node bin/backup.js` and `node bin/regen-html.js`.

#### Scenario: README usage examples

- GIVEN `README.md` is updated
- WHEN the usage section is inspected
- THEN all commands reference `bin/backup.js` or `bin/regen-html.js`
- AND no commands reference `backup.js` or `regen-html.js` at the root

### Requirement: AGENTS File Structure Updated

The system MUST update `AGENTS.md` to show the new directory layout (`bin/`, `src/`, `test/helpers/`) and to indicate that tests, lint, format, and CI now exist.

#### Scenario: New agent onboarding documentation

- GIVEN `AGENTS.md` is updated
- WHEN the file structure section is inspected
- THEN it lists `bin/backup.js`, `bin/regen-html.js`, `src/config.js`, `src/utils.js`, `src/downloader.js`, `src/cancel-token.js`, and `src/templates/viewer.html`
- AND the stack section notes the presence of tests, lint, format, and CI

### Requirement: AGENTS How to Run Updated

The system MUST update `AGENTS.md` so that the "How to Run" examples use the new commands.

#### Scenario: Running the tool from AGENTS.md

- GIVEN `AGENTS.md` is updated
- WHEN the run instructions are followed
- THEN they execute `node bin/backup.js` and `node bin/regen-html.js backups/channel-name`

### Requirement: OpenSpec Config Reflects Current Stack

The system MUST update `openspec/config.yaml` to reflect the current stack, the new directory layout, and the availability of tests, lint, and format.

#### Scenario: openspec/config.yaml context block

- GIVEN `openspec/config.yaml` is updated
- WHEN the `context` field is read
- THEN it describes the Node.js CommonJS CLI, the `bin/` + `src/` layout, and Playwright browser automation
- AND it no longer claims there is no test framework, linter, formatter, or CI

#### Scenario: openspec/config.yaml testing section

- GIVEN `openspec/config.yaml` is updated
- WHEN the `testing` and `quality` sections are read
- THEN `unit` tests are available with `node:test`
- AND `linter` and `formatter` are available with their respective commands

### Requirement: Runtime Data Directories Documented

The system MUST document in `README.md` and `AGENTS.md` that `backups/` and `browser-profile/` are runtime data directories that remain in the workspace and are not part of the source cleanup.

#### Scenario: Runtime directories are documented

- GIVEN `README.md` and `AGENTS.md` are updated
- WHEN the documentation is inspected
- THEN it states that `backups/` and `browser-profile/` are runtime directories
- AND it states that they are preserved during cleanup and restructuring

### Requirement: No Stale Path References

The system MUST ensure that no documentation or spec context file contains stale references to the old root-level module names.

#### Scenario: Grep for old root-level references

- GIVEN all docs and `openspec/config.yaml` are updated
- WHEN a search for legacy root-level CLI commands is performed
- THEN no matches remain in user-facing or spec context documentation
