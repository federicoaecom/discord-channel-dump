# Structural Quality Specification

## Purpose
Separate concerns, reduce monoliths, and validate configuration.

## Requirements

### Requirement: External HTML template
The HTML viewer template MUST be stored outside `utils.js` in a dedicated file.

#### Scenario: Template extraction
- GIVEN `templates/viewer.html` exists
- WHEN `utils.js` generates the HTML
- THEN it reads the template instead of embedding the full string

### Requirement: Utility file scope
`utils.js` MUST contain only helper functions and MUST NOT contain the HTML template string.

#### Scenario: Inspect utils.js
- GIVEN a developer reads `utils.js`
- THEN no multi-line HTML document string is present

### Requirement: Reduced monolith
`backup.js` MUST be decomposed into smaller, focused functions with clear responsibilities.

#### Scenario: Read backup.js
- GIVEN a developer reviews `backup.js`
- THEN the main function orchestrates calls rather than containing all logic

### Requirement: Config validation
`config.js` MUST validate tunables at startup and throw on invalid values.

#### Scenario: Invalid batch size
- GIVEN `apiBatchSize` is set to `0`
- WHEN the config loads
- THEN the process exits with a clear error message

#### Scenario: Invalid delay
- GIVEN `apiDelayMs` is negative
- WHEN the config loads
- THEN the process exits with a clear error message

### Requirement: Cross-platform path consistency
All file path construction MUST use `path.join` and avoid hardcoded separators.

#### Scenario: Directory creation
- GIVEN the tool creates backup directories
- THEN it uses `path.join` instead of string concatenation with `/`
