# Spec: Split `src/utils.js` into Focused Modules

## ID

`split-utils`

## Summary

`src/utils.js` MUST be converted into a backwards-compatible re-export barrel. Each utility function MUST move to a focused module under `src/utils/` or `src/viewer/`.

## Requirements

### R1: New focused modules exist

- `src/utils/sanitize.js` MUST export `sanitize`.
- `src/utils/html.js` MUST export `escapeHtml`.
- `src/utils/filenames.js` MUST export `filenameFromUrl` and `uniqueFilename`.
- `src/utils/icons.js` MUST export `iconFor`.
- `src/viewer/render.js` MUST export `generateHtml`.

### R2: Barrel preserves compatibility

`src/utils.js` MUST re-export all functions from the new modules so existing imports continue to work.

### R3: Behavior is preserved

Each function MUST produce the same output as before the split for the same inputs.

## Scenarios

### S1: Existing imports still work

**Given** a test file imports from `src/utils.js`  
**When** it calls `sanitize`, `escapeHtml`, `filenameFromUrl`, `uniqueFilename`, `iconFor`, or `generateHtml`  
**Then** it gets the same results as before.

### S2: New modules can be imported directly

**Given** a test file imports from `src/utils/sanitize.js`  
**When** it calls `sanitize`  
**Then** it returns the sanitized name.

### S3: `src/utils.js` does not contain internal logic

**Given** `src/utils.js`  
**When** it is read  
**Then** it contains only `require` and `module.exports` statements.
