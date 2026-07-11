# Native Test Runner Specification

## Purpose
Define the built-in Node.js test runner setup for `discord-channel-dump` so all automated tests run without external test dependencies.

## Requirements

### Requirement: Test Runner

The project MUST use the Node.js built-in `node:test` module as its test runner. The project MUST NOT add an external test framework such as Jest, Mocha, or Vitest as a dev dependency for the test runner.

#### Scenario: Running tests

- GIVEN `package.json` has a `test` script
- WHEN a developer runs `npm test`
- THEN all files in `test/` matching `*.test.js` are discovered and executed by `node:test`
- AND the process exits with code `0` when all tests pass

### Requirement: Test Scripts

`package.json` MUST define `test` and `test:watch` scripts. The `test` script MUST run the test suite once; the `test:watch` script MUST rerun the suite when files change.

#### Scenario: Watch mode

- GIVEN `npm run test:watch` is executing
- WHEN a test file or source file is modified
- THEN the test suite reruns automatically

### Requirement: Test Directory

All test files MUST reside under a `test/` directory in the project root. The file naming convention MUST be `*.test.js`.

#### Scenario: Test discovery

- GIVEN `test/config.test.js` and `test/utils.test.js` exist
- WHEN `npm test` runs
- THEN both files are loaded and executed by the runner

### Requirement: Assertion Library

Test files MUST use the Node.js built-in `node:assert` module for assertions. Test files MAY use `node:assert/strict`.

#### Scenario: Failing assertion

- GIVEN a test asserts `assert.strictEqual(1, 2)`
- WHEN the test runs
- THEN `node:test` reports the failure and exits with a non-zero code
