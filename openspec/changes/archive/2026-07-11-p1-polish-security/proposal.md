# Proposal: P1 Polish and Security Improvements

## Change

`p1-polish-security`

## Intent

Address three P1 opportunities from the project review: split the `src/utils.js` kitchen sink into focused modules, harden the offline viewer with a Content Security Policy and safer external links, and improve the terminal user experience with colors and a more informative progress display.

## Scope

**In scope:**

1. **Split `src/utils.js`** into focused modules:
   - `src/utils/sanitize.js`
   - `src/utils/html.js` (`escapeHtml`)
   - `src/utils/filenames.js` (`filenameFromUrl`, `uniqueFilename`)
   - `src/utils/icons.js` (`iconFor`)
   - `src/viewer/render.js` (`generateHtml`)
   - Update all imports and re-export from `src/utils.js` for backwards compatibility.

2. **Harden the offline viewer:**
   - Add a `Content-Security-Policy` meta tag to `src/templates/viewer.html`.
   - Add `rel="noopener noreferrer"` to all `<a>` links that open in a new tab.
   - Keep search and date filtering working.

3. **Improve terminal UX:**
   - Add ANSI colors to status, warning, and error messages.
   - Add a progress bar for image/attachment downloads that shows percent, bytes, and ETA.
   - Keep the existing interactive flow unchanged.

**Out of scope:**

- New features in the viewer (e.g., dark/light mode, sorting).
- New CLI flags beyond the existing ones.
- Changing the downloader retry/redirect logic.
- Changing Discord API behavior.
- Adding new runtime dependencies (colors will be implemented with ANSI escape codes).

## Non-Goals

- This is not a redesign of the UI or CLI flow.
- This does not add TypeScript.

## Success Criteria

- All existing tests pass.
- New tests cover the split modules, CSP attributes, and progress formatting.
- `src/utils.js` no longer contains internal logic; it only re-exports.
- The viewer HTML contains a CSP meta tag and all `target="_blank"` links have `rel="noopener noreferrer"`.
- Terminal output uses color for errors/warnings and shows a progress bar during downloads.
- Lint and format are clean.

## Affected Areas

| Area | Impact |
|---|---|
| `src/utils.js` | Becomes a re-export barrel. |
| `src/utils/*.js` | New focused utility modules. |
| `src/viewer/render.js` | New module for HTML generation. |
| `src/templates/viewer.html` | CSP meta tag + safer links. |
| `src/output/writer.js` | Improved progress output. |
| `src/app.js` | Colored status/warning messages. |
| `src/cli/backup-args.js` | No changes. |
| `test/` | New tests for split modules and viewer. |
| `README.md` | Minor updates if UX changes are visible. |

## Risk

| Risk | Severity | Mitigation |
|---|---|---|
| Import paths break after utils split. | Medium | Keep `src/utils.js` as a compatibility barrel; run full test suite. |
| CSP blocks the inline viewer script. | High | CSP must allow `script-src 'unsafe-inline'` since the viewer is a single static file. |
| Progress bar breaks on Windows terminals. | Low | Use simple ANSI codes that work in modern Windows Terminal and conhost. |
| Color output breaks when stdout is not a TTY. | Low | Detect `process.stdout.isTTY` and skip colors when not interactive. |

## Rollback Plan

- Each work unit is committed independently.
- If the viewer CSP causes issues, revert the single line in the template.
- If the progress bar causes issues, revert the changes in `src/output/writer.js`.

## Delivery

Single PR with maintainer-approved size exception (cached from previous change).
