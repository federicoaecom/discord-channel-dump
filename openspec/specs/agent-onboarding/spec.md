# Agent Onboarding Specification

## Purpose
Define project documentation and agent onboarding artifacts so future agents can work effectively.

## Requirements

### Requirement: Agent onboarding document
The system MUST provide an `AGENTS.md` file at the repository root.

#### Scenario: New agent opens the project
- GIVEN the repository is cloned
- WHEN an agent lists the root files
- THEN `AGENTS.md` exists and is readable

### Requirement: README language and paths
The README MUST be written in consistent English and use cross-platform path notation.

#### Scenario: Cross-platform example
- GIVEN a user reads the README
- WHEN they follow the backup example
- THEN the path uses forward slashes and works on Windows, macOS, and Linux

### Requirement: README links
The README MUST NOT contain `file://` hyperlinks to local files.

#### Scenario: Link check
- GIVEN the README is rendered
- WHEN a link points to a project file
- THEN it uses a relative path instead of `file://`

### Requirement: Project documentation completeness
Project docs MUST describe the stack, file structure, and how to run the tool.

#### Scenario: First-time user
- GIVEN a new user opens the README
- WHEN they read the setup and usage sections
- THEN they can install dependencies and run `node bin/backup.js`
