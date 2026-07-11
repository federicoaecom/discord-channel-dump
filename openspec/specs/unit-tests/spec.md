# Unit Tests Specification

## Purpose
Define unit test coverage for `config.js` and `utils.js` helpers, plus the exported CLI parsing functions.

## Requirements

### Requirement: Config Validation

The `validateConfig` function MUST be tested for valid and invalid inputs. Tests MUST cover `backupDir`, `profileDir`, `apiBatchSize`, `apiDelayMs`, and `downloadTimeoutMs`.

#### Scenario: Valid config

- GIVEN an object with all required fields and valid values
- WHEN `validateConfig` is called
- THEN it returns without throwing

#### Scenario: Invalid config values

- GIVEN a config with `apiBatchSize` equal to `0`
- WHEN `validateConfig` is called
- THEN it throws `ConfigError` with a descriptive message

#### Scenario: Missing required fields

- GIVEN a config missing `backupDir`
- WHEN `validateConfig` is called
- THEN it throws `ConfigError`

### Requirement: Utility Helpers

The exported helpers in `utils.js` MUST be tested for happy paths and edge cases. Covered helpers MUST include `sanitize`, `escapeHtml`, `filenameFromUrl`, `uniqueFilename`, and `iconFor`.

#### Scenario: Sanitize channel name

- GIVEN the channel name `"# foo/bar | baz"`
- WHEN `sanitize` is called
- THEN it returns `"foo_bar _ baz"`

#### Scenario: Escape HTML entities

- GIVEN the string `"<script>&\""`
- WHEN `escapeHtml` is called
- THEN it returns `"&lt;script&gt;&amp;&quot;"`

#### Scenario: Filename from invalid URL

- GIVEN the string `"not-a-url"`
- WHEN `filenameFromUrl` is called
- THEN it returns a fallback name starting with `file_`

### Requirement: HTML Generation

The `generateHtml` function MUST be tested with a valid `templates/viewer.html` fixture. Tests MUST verify placeholder replacement and behavior with an empty message list.

#### Scenario: Empty message list

- GIVEN a channel name and an empty messages array
- WHEN `generateHtml` is called
- THEN the output contains the channel name and `"0"` as the message count
- AND the `{{ROWS}}` placeholder is replaced with an empty string

### Requirement: CLI Parsing Exports

`backup.js` MUST export `parseCliArgs` and `applyOverrides`. `regen-html.js` MUST export `parseCliArgs`. These exports MUST be unit-testable without invoking the full CLI.

#### Scenario: Parse backup arguments

- GIVEN `parseCliArgs(["--output", "./out", "--profile", "./prof"])` from `backup.js`
- WHEN the function is called
- THEN it returns `{ output: "./out", profile: "./prof", help: false, version: false }`

#### Scenario: Unknown regen-html option

- GIVEN `parseCliArgs(["--foo"])` from `regen-html.js`
- WHEN the function is called
- THEN it returns `{ error: "Unknown option: --foo" }`
