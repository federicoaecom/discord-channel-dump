# Update Tooling Configs Specification

## Purpose

Update `package.json`, ESLint, Prettier, and CI configuration so that scripts, linting, formatting, and automation match the new directory layout.

## Requirements

### Requirement: package.json Points to New Paths

The system MUST update `package.json` so that `main`, `bin`, and all npm scripts reference the new file locations (`bin/backup.js`, `bin/regen-html.js`).

#### Scenario: npm scripts after restructure

- GIVEN `bin/backup.js` and `bin/regen-html.js` are in place
- WHEN `package.json` is updated
- THEN `scripts.backup` equals `node bin/backup.js`
- AND `scripts.regen` equals `node bin/regen-html.js`
- AND `main` equals `bin/backup.js`
- AND `bin["discord-channel-dump"]` equals `bin/backup.js`

#### Scenario: CLI commands execute correctly through npm

- GIVEN `package.json` scripts point to `bin/`
- WHEN `npm run backup -- --help` and `npm run regen -- --help` are executed
- THEN each command prints usage and exits with code 0

### Requirement: ESLint Includes New Directories

The system MUST update `.eslintrc.json` so that `bin/`, `src/`, and `test/` are linted, while generated and runtime directories remain ignored.

#### Scenario: Linting the new layout

- GIVEN `.eslintrc.json` is updated
- WHEN `npm run lint` is executed
- THEN the linter checks `bin/`, `src/`, and `test/`
- AND `node_modules/`, `backups/`, and `browser-profile/` are still ignored
- AND the command exits with code 0

#### Scenario: Ignored directories remain excluded

- GIVEN `.eslintrc.json` contains `ignorePatterns`
- WHEN `npm run lint` is executed
- THEN the linter does not report errors from files under `backups/` or `browser-profile/`

### Requirement: Prettier Includes New Directories

The system MUST update `.prettierignore` to include `bin/`, `src/`, and `test/` and remove stale entries such as `templates/`.

#### Scenario: Format check passes after restructure

- GIVEN `.prettierignore` is updated
- WHEN `npm run format:check` is executed
- THEN the formatter checks the new source directories
- AND generated or runtime directories are still ignored
- AND the command exits with code 0

### Requirement: CI Workflow Uses New Commands

The system MUST update the GitHub Actions workflow (`.github/workflows/ci.yml`) to use the new `npm run` commands and path conventions.

#### Scenario: CI workflow references updated paths

- GIVEN `.github/workflows/ci.yml` is updated
- WHEN the CI steps run
- THEN `npm test`, `npm run lint`, and `npm run format:check` are invoked
- AND no commands reference the old root-level script names

### Requirement: No New Tooling Dependencies

The system MUST NOT add new runtime dependencies or new development dependencies beyond those already declared.

#### Scenario: package.json dependencies unchanged

- GIVEN `package.json` is updated
- WHEN its dependency lists are compared to the original
- THEN no new package names are added to `dependencies` or `devDependencies`
