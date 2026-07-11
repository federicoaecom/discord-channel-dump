# Quality Tooling Specification

## Purpose
Define ESLint and Prettier setup for static analysis and consistent formatting without adding runtime dependencies.

## Requirements

### Requirement: ESLint Configuration

The project MUST provide an ESLint configuration file. The configuration SHOULD extend at minimum `eslint:recommended`. ESLint MUST be listed as a dev dependency in `package.json`.

#### Scenario: Lint command

- GIVEN `package.json` has a `lint` script that runs ESLint
- WHEN a developer runs `npm run lint`
- THEN ESLint checks all JavaScript files in the project
- AND the command exits with code `0` when no lint errors are found

#### Scenario: Lint detects error

- GIVEN a JavaScript file contains an `eslint:recommended` error such as an unused variable
- WHEN `npm run lint` runs
- THEN the command reports the error and exits with a non-zero code

### Requirement: Prettier Configuration

The project MUST provide a Prettier configuration file. Prettier MUST be listed as a dev dependency in `package.json`. Format scripts MUST be present in `package.json`.

#### Scenario: Format check

- GIVEN `package.json` has a `format:check` script
- WHEN a developer runs `npm run format:check`
- THEN Prettier checks all project files for formatting
- AND the command exits with code `0` when all files are formatted

#### Scenario: Format write

- GIVEN `package.json` has a `format` script that runs `prettier --write`
- WHEN a developer runs `npm run format`
- THEN Prettier rewrites files that do not match the configured style

### Requirement: Dev Dependency Only

ESLint and Prettier MUST be declared as `devDependencies` and MUST NOT be added to `dependencies`.

#### Scenario: Package manifest

- GIVEN `package.json` is inspected
- WHEN ESLint and Prettier are installed
- THEN they appear only under `devDependencies`
- AND no runtime script requires them to run
