# Spec: Browser Session Abstraction

## ID

`browser-session-abstraction`

## Summary

All browser launch, session persistence, token capture, and DOM-based channel detection MUST move to `src/browser/session.js`. The token MUST be captured from outgoing browser requests and exposed only through a Node-side getter.

## Requirements

### R1: Browser session module exists

`src/browser/session.js` MUST exist and export `launchBrowser`, `getChannelId`, and `getChannelNameFromDom`.

### R2: Browser launch is centralized

`launchBrowser(profileDir)` MUST:

- Launch a persistent Chromium context using `profileDir`.
- Open a new page if one does not exist.
- Start token capture.
- Return `{ context, page, session }` where `session.getToken()` returns the captured token or `null`.
- Set `_context` or equivalent so the shutdown handler can close the browser.

### R3: Token capture behavior is preserved

`session.getToken()` MUST return the first `Authorization` header seen on a request to `discord.com/api` that has more than 10 characters.

### R4: Channel ID detection is preserved

`getChannelId(page)` MUST return the channel ID captured from the current URL path `/channels/<guild>/<channel>` or `null`.

### R5: DOM-based channel name fallback is preserved

`getChannelNameFromDom(page)` MUST return the channel name from a set of DOM selectors or `"unknown"`.

### R6: No API calls are made from the page context

`src/browser/session.js` MUST NOT contain any `page.evaluate()` calls that make network requests or use the token.

## Scenarios

### S1: Launch browser and capture token

**Given** a valid profile directory  
**When** `launchBrowser(profileDir)` is called  
**Then** it returns a context, page, and session, and `session.getToken()` is initially `null`.

### S2: Capture token from API request

**Given** a page that navigates to a Discord-like URL and makes an API request with an `Authorization` header  
**When** the request is intercepted  
**Then** `session.getToken()` returns the header value.

### S3: Detect channel ID from URL

**Given** a page at `https://discord.com/channels/123/456`  
**When** `getChannelId(page)` is called  
**Then** it returns `"456"`.

### S4: Detect channel ID fails on non-channel URL

**Given** a page at `https://discord.com/app`  
**When** `getChannelId(page)` is called  
**Then** it returns `null`.

## Notes

- This spec is part of the larger `refactor-backup-js-api-security` change.
- Token capture is the only place where the token is exposed. The token is stored only in the Node process memory.
