# CI Workflow Specification

## Purpose
Define a GitHub Actions workflow that runs lint and tests on the Node.js versions declared in `package.json` once the project is pushed to a GitHub repository.

## Requirements

### Requirement: Workflow File

The project MUST contain a `.github/workflows/ci.yml` workflow file. The workflow MUST trigger on `push` and `pull_request` to the default branch. The workflow file MUST be valid YAML.

#### Scenario: File exists

- GIVEN the project root is inspected
- WHEN `.github/workflows/ci.yml` is read
- THEN the file defines a workflow with a name, triggers, and jobs

### Requirement: Node Version Matrix

The workflow MUST run on Node.js versions matching `engines.node` in `package.json`. It MUST exercise the exact Node.js 20.19.0 and 22.13.0 support floors plus a supported Node.js 24 release or channel.

#### Scenario: Job matrix

- GIVEN the CI file defines a test job
- WHEN the `node-version` matrix is inspected
- THEN it includes `20.19.0`, `22.13.0`, and a supported Node.js 24 release or channel
- AND every matrix entry matches the declared engine range

### Requirement: CI Steps

The workflow MUST run the following steps: checkout the repository, install dependencies with `npm ci`, install Playwright Chromium, run lint, run format check, and run tests. On the Node.js 20.19.0 matrix entry only, it MUST also audit production dependencies and smoke-test the packed CLI.

#### Scenario: Pull request workflow

- GIVEN a pull request is opened against the default branch
- WHEN the workflow runs
- THEN it executes `npm ci`, `npx playwright install chromium`, `npm run lint`, `npm run format:check`, and `npm test` sequentially
- AND the job fails if any step exits with a non-zero code

#### Scenario: Audit and package smoke test

- GIVEN the workflow runs on the Node.js 20.19.0 matrix entry
- WHEN the job executes
- THEN it runs `npm audit --omit=dev` after `npm ci`
- AND after the tests it packs the project with `npm pack`, installs the tarball globally into a temporary prefix, and checks that `discord-channel-dump --help` prints `Usage:` and `discord-channel-dump --version` matches `package.json`

### Requirement: Push and Pull Request Triggers

The workflow MUST run on pushes and on pull requests.

#### Scenario: Pull request opened

- GIVEN a contributor opens a pull request
- WHEN GitHub evaluates workflow triggers
- THEN the CI workflow runs on that pull request

### Requirement: No Browser Secrets in CI

The workflow MUST NOT require Discord credentials, Playwright browser secrets, or live API keys for the tests to pass. Tests run in CI are lint, the format check, and the automated test suite, which MAY launch a local headless browser but MUST NOT need live Discord access.

#### Scenario: Public fork run

- GIVEN a contributor forks the repository and opens a pull request
- WHEN the CI workflow runs on their branch
- THEN all checks pass without any Discord or Playwright secrets
