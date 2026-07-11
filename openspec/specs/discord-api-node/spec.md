# Spec: Discord API Calls in Node Context

## ID

`discord-api-node`

## Summary

All Discord REST API calls MUST be made from the Node process using Playwright's request context. The authorization token MUST NOT be passed into the browser page context.

## Requirements

### R1: API module exists

`src/api/discord.js` MUST exist and export `getChannelName` and `fetchAllMessages`.

### R2: API calls use Node request context

Both functions MUST accept a Playwright `request` context object and a `token` string. They MUST use `request.get()` or `request.fetch()` to call Discord's API.

### R3: Token is used in request headers

Every API request MUST include the header `Authorization: <token>` and `Content-Type: application/json`.

### R4: Token is not passed to the page

`src/api/discord.js` MUST NOT use `page.evaluate()` or any other browser-page mechanism that exposes the token to the page context.

### R5: fetchAllMessages pagination is preserved

`fetchAllMessages(request, token, channelId, config)` MUST:

- Start with the most recent messages.
- Use `before=<oldest id>` to fetch older pages.
- Stop when a page returns fewer messages than `config.apiBatchSize` or an empty page.
- Respect rate limits by reading `retry_after` from 429 responses and waiting.
- Throw a clear error on non-OK, non-retryable responses.
- Sort the final list chronologically (oldest first).
- Respect `config.apiDelayMs` between requests.

### R6: getChannelName uses API first

`getChannelName(request, token, channelId)` MUST:

- Call `/api/v9/channels/<channelId>`.
- Return `data.name` if the response is OK and contains a name.
- Return `null` if the request fails or the channel has no name.

## Scenarios

### S1: Fetch all messages in a channel

**Given** a request context, a valid token, and a channel with 120 messages  
**When** `fetchAllMessages` is called with `apiBatchSize: 50`  
**Then** it returns all 120 messages sorted oldest-first.

### S2: Rate limit retry

**Given** the API returns 429 with `retry_after: 1` on the first request  
**When** `fetchAllMessages` is called  
**Then** it waits and retries, then returns the messages.

### S3: API error

**Given** the API returns 403  
**When** `fetchAllMessages` is called  
**Then** it throws an error with the HTTP status and response body.

### S4: Get channel name

**Given** a request context and a valid token  
**When** `getChannelName` is called for a channel  
**Then** it returns the channel name from the API response.

### S5: Token is not passed to page context

**Given** a valid token  
**When** `fetchAllMessages` or `getChannelName` runs  
**Then** no `page.evaluate` call uses the token.

## Notes

- This spec is the core security improvement of the `refactor-backup-js-api-security` change.
- The request context can be obtained from `context.request` after launching a persistent browser context.
