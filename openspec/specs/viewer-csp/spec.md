# Spec: Viewer CSP and Safer External Links

## ID

`viewer-csp`

## Summary

The offline viewer `src/templates/viewer.html` MUST include a Content-Security-Policy meta tag and all `target="_blank"` links MUST include `rel="noopener noreferrer"`.

## Requirements

### R1: CSP meta tag exists

`src/templates/viewer.html` MUST contain a `<meta http-equiv="Content-Security-Policy">` tag with:
- `default-src 'self'`
- `script-src 'self' 'unsafe-inline'`
- `style-src 'self' 'unsafe-inline'`
- `img-src 'self' data:`
- `connect-src 'none'`
- `frame-src 'none'`

### R2: External links are safe

Every `<a>` element with `target="_blank"` MUST also have `rel="noopener noreferrer"`.

### R3: Viewer functionality is preserved

Search, date filtering, clear button, and Ctrl+F hijack MUST continue to work after the CSP is added.

## Scenarios

### S1: CSP present in generated HTML

**Given** `generateHtml` is called with any channel and messages  
**When** the output HTML is inspected  
**Then** it contains a CSP meta tag with the required directives.

### S2: Links have safe rel attributes

**Given** a message with images and attachments  
**When** `generateHtml` produces the HTML  
**Then** all rendered links with `target="_blank"` include `rel="noopener noreferrer"`.

### S3: Inline script still executes

**Given** the generated HTML is loaded in a browser  
**When** the user types in the search box  
**Then** the messages are filtered without CSP violations.
