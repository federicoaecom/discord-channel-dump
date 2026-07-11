# secure-viewer Specification

## Purpose
Prevent offline-viewer XSS by ensuring search highlighting never parses message strings as HTML.

## Requirements

### Requirement: DOM-safe highlight

The system MUST highlight matched text using DOM text nodes only; it MUST NOT use `innerHTML` with message-derived strings.

#### Scenario: HTML-like message text

- GIVEN a message contains `<img src=x onerror=alert(1)>`
- WHEN the user searches for matching text
- THEN the matched text is highlighted and no script executes.

### Requirement: Escaped search input

The system MUST escape search input before building a regex.

#### Scenario: Regex metacharacters

- GIVEN the user types `.*`
- WHEN the search runs
- THEN only the literal characters `.*` are matched.
