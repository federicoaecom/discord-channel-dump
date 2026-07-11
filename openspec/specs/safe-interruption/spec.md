# safe-interruption Specification

## Purpose
Allow a backup to be interrupted safely, leaving no partial files and returning a nonzero exit code.

## Requirements

### Requirement: Cancellation token

The system MUST thread a cancellation token through `downloadMedia` and `processChannel`; checked operations MUST abort when cancelled.

#### Scenario: Cancel during download

- GIVEN a download is in progress
- WHEN the token is cancelled
- THEN the active download stops and the loop exits.

### Requirement: SIGINT handling

The system MUST handle SIGINT by cancelling the token, removing `.part` files, and exiting with a nonzero status.

#### Scenario: Interrupt during media download

- GIVEN a backup is downloading media
- WHEN the user presses Ctrl-C
- THEN `.part` files are deleted and the process exits with a nonzero code.
