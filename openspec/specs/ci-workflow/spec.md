# CI Workflow Specification

## Purpose
Define a GitHub Actions workflow that runs lint and tests on Node.js 18+ once the project is pushed to a GitHub repository.

## Requirements

### Requirement: Workflow File

The project MUST contain a `.github/workflows/ci.yml` workflow file. The workflow MUST trigger on `push` and `pull_request` to the default branch. The workflow file MUST be valid YAML.

#### Scenario: File exists

- GIVEN the project root is inspected
- WHEN `.github/workflows/ci.yml` is read
- THEN the file defines a workflow with a name, triggers, and jobs

### Requirement: Node Version Matrix

The workflow MUST run on Node.js versions matching `engines.node` in `package.json`. At minimum, the workflow MUST run on Node.js 18.

#### Scenario: Job matrix

- GIVEN the CI file defines a test job
- WHEN the `node-version` matrix is inspected
- THEN it includes `18.x` and matches the declared engine range

### Requirement: CI Steps

The workflow MUST run the following steps: checkout the repository, install dependencies, run lint, run format check, and run tests.

#### Scenario: Pull request workflow

- GIVEN a pull request is opened against the default branch
- WHEN the workflow runs
- THEN it executes `npm install`, `npm run lint`, `npm run format:check`, and `npm test` sequentially
- AND the job fails if any step exits with a non-zero code

### Requirement: Inactive Until Git Push

The workflow file is intentionally shipped before the project is a git repository. The project documentation or workflow comments MUST note that the workflow only runs after `git init`, a remote is configured, and code is pushed to GitHub.

#### Scenario: Local only environment

- GIVEN the project is not initialized as a git repository
- WHEN a developer reads the CI file or related docs
- THEN it is clear that the workflow is a future-ready artifact that becomes active only after pushing to GitHub

### Requirement: No Browser Secrets in CI

The workflow MUST NOT require Discord credentials, Playwright browser secrets, or live API keys for the tests to pass. Tests run in CI MUST be limited to lint, format, and smoke/unit tests.

#### Scenario: Public fork run

- GIVEN a contributor forks the repository and opens a pull request
- WHEN the CI workflow runs on their branch
- THEN all checks pass without any Discord or Playwright secrets
