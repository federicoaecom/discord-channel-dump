# Spec: Channel Output Writer

## ID

`output-writer`

## Summary

The logic that writes `messages.json` and `index.html` for a channel MUST move to `src/output/writer.js`. This module MUST orchestrate media downloads and file output in a testable way.

## Requirements

### R1: Output writer module exists

`src/output/writer.js` MUST exist and export `saveChannel`.

### R2: saveChannel creates directories and writes files

`saveChannel(channelName, messages, config)` MUST:

- Create the channel directory under `config.backupDir`.
- Create `images/` and `attachments/` subdirectories.
- Call `downloadMedia` (or equivalent) to download images and attachments.
- Write `messages.json` with the normalized messages array.
- Write `index.html` using `generateHtml`.
- Return metadata about the saved channel (message count, image count, attachment count).

### R3: Directory names are sanitized

The channel directory name MUST be sanitized using the existing `sanitize` function.

### R4: Existing files are preserved

Files that already exist in `images/` and `attachments/` MUST NOT be re-downloaded.

### R5: Cancellation is respected

`saveChannel` MUST accept a `cancelToken` and stop work if it is cancelled.

## Scenarios

### S1: Save channel with messages and images

**Given** a channel name, normalized messages, and config  
**When** `saveChannel` is called  
**Then** it creates the channel directory, downloads images, and writes `messages.json` and `index.html`.

### S2: Skip existing files

**Given** an image file already exists in the channel's `images/` directory  
**When** `saveChannel` is called again  
**Then** it does not re-download the existing file.

### S3: Cancellation stops work

**Given** a `cancelToken` that is cancelled before download begins  
**When** `saveChannel` is called  
**Then** it stops and throws a cancellation error.

## Notes

- This spec is part of the larger `refactor-backup-js-api-security` change.
- The download orchestration logic currently in `bin/backup.js` moves here.
- `processChannel` is effectively replaced by `saveChannel`.
