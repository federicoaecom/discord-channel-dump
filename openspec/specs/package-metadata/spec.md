# Package Metadata Specification

## Purpose
Ensure `package.json` contains production-ready metadata and scripts.

## Requirements

### Requirement: Binary entry
`package.json` MUST declare a `bin` entry pointing to `backup.js`.

#### Scenario: Global install
- GIVEN the package is installed globally
- WHEN the user runs `discord-channel-dump`
- THEN the CLI executes `backup.js`

### Requirement: Engine constraints
`package.json` MUST include an `engines` field specifying the supported Node.js version.

#### Scenario: Incompatible Node
- GIVEN a user runs `npm install` with Node below the required version
- THEN npm emits an engine warning

### Requirement: SPDX license
`package.json` MUST include a `license` field with a valid SPDX identifier.

#### Scenario: Package inspection
- GIVEN a user reads `package.json`
- THEN `license` is present and recognizable

### Requirement: Repository and keywords
`package.json` SHOULD include `repository` and `keywords` fields.

#### Scenario: Discoverability
- GIVEN the package is published
- THEN registry consumers see the repository and keywords
