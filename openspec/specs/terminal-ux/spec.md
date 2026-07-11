# Spec: Terminal Colors and Progress Bar

## ID

`terminal-ux`

## Summary

Terminal output MUST use color when running in a TTY, and the download progress MUST display a percent-based progress bar with bytes and ETA.

## Requirements

### R1: Color helpers exist

`src/ui/colors.js` MUST export `red`, `green`, `yellow`, `cyan`, and `dim` functions that wrap text in ANSI escape codes when `process.stdout.isTTY` is truthy.

### R2: Non-TTY output is plain

When stdout is not a TTY, color helpers MUST return the plain text without escape codes.

### R3: Status and warning messages are colored

`src/app.js` MUST use color helpers for:
- Success/finished messages: green
- Warnings (missing token, channel ID): yellow
- Errors: red
- Hints/labels: cyan/dim

### R4: Progress bar for downloads

`src/output/writer.js` MUST show a single-line progress bar for images and attachments that includes:
- A `[████...]` bar representing percent done.
- The current file number and total.
- The percentage.
- Downloaded bytes (when available) or total count.
- Estimated time remaining.

### R5: Existing interactive flow is unchanged

Colors and progress MUST NOT change the prompts, the "exit" command, or the overall sequence.

## Scenarios

### S1: Color in TTY

**Given** stdout is a TTY  
**When** `red("error")` is called  
**Then** the result starts with `\x1b[31m` and ends with `\x1b[0m`.

### S2: Plain text when not TTY

**Given** stdout is not a TTY  
**When** `red("error")` is called  
**Then** the result is exactly `"error"`.

### S3: Progress bar renders

**Given** 10 files to download and 3 already done  
**When** `renderProgressBar(30, { current: 4, total: 10 })` is called  
**Then** the output contains a bar, "30%", and "4/10".

### S4: App output uses colors

**Given** the app runs with a stubbed console in TTY mode  
**When** a warning is printed  
**Then** the output contains ANSI yellow codes.
