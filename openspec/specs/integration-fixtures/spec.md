# integration-fixtures Specification

## Purpose
Provide a local HTTP server for deterministic, credential-free integration tests.

## Requirements

### Requirement: Local HTTP server

The system MUST provide a startable/stoppable local HTTP server for tests.

#### Scenario: Server lifecycle

- GIVEN a test starts the server
- WHEN the test stops it
- THEN all sockets are released.

### Requirement: Configurable responses

The server MUST support configurable status codes, bodies, headers, redirect chains, and throttled responses.

#### Scenario: Redirect chain

- GIVEN a test configures a chain of `302` redirects
- WHEN a request hits the server
- THEN it returns each redirect in order.

### Requirement: Credential-free tests

The system MUST use the fixture server for downloader and interrupt tests without Discord credentials.

#### Scenario: Downloader test with fixture

- GIVEN the fixture server serves a test file
- WHEN `downloadFile` is tested against it
- THEN the test passes without Discord network access.
