# robust-downloader Specification

## Purpose
Download media reliably: bounded redirects, retry/backoff, atomic writes, cleanup.

## Requirements

### Requirement: Bounded redirects

The system MUST follow redirects up to a configured maximum and resolve relative `Location` headers.

#### Scenario: Redirect loop

- GIVEN a server returns infinite `302` redirects
- WHEN `downloadFile` is called
- THEN it stops after the maximum and reports an error.

### Requirement: Retry transient errors

The system MUST retry 5xx, 429, and network errors with backoff plus jitter; it MUST fail on non-retryable 4xx.

#### Scenario: 503 then success

- GIVEN a server returns `503` twice then `200`
- WHEN `downloadFile` is called
- THEN it retries and completes the download.

### Requirement: Atomic writes and cleanup

The system MUST write to `.part` files and rename on success; it MUST delete `.part` files on any failure.

#### Scenario: Stream error

- GIVEN a download stream fails mid-write
- WHEN the error occurs
- THEN the `.part` file is removed and the destination is not created.
