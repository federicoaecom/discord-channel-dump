# Proposal: Reliable and Secure Backups

## Intent

Address the three P1 risks from the post-hardening audit: XSS in the offline viewer search, fragile media downloads, and unsafe backup interruption. Also enforce Discord's `apiBatchSize <= 100` limit and add deterministic local HTTP fixture tests so the risk-heavy paths can be verified without Discord credentials.

## Scope

### In Scope
- Sanitize search highlighting in `templates/viewer.html` to prevent message-derived HTML from becoming live DOM.
- Rewrite `downloader.js` with bounded redirects, retry/backoff, atomic writes, and cleanup on failure.
- Add cancellation token and partial-file cleanup to `backup.js` so interruption exits nonzero with no orphaned files.
- Enforce `apiBatchSize <= 100` in `config.js`.
- Add local HTTP fixture tests for the downloader and interruption paths.

### Out of Scope
- TTY/EOF/non-interactive CLI behavior (reserved for `cli-release-readiness`).
- Release policy, CI activation, cross-platform terminal tests.
- New runtime dependencies.

## Capabilities

### New Capabilities
- `secure-viewer`: DOM-safe search highlighting without `innerHTML` of message text.
- `robust-downloader`: bounded redirects, retry/backoff, atomic writes, stream-error cleanup.
- `safe-interruption`: cancellation token, SIGINT handling, partial-file cleanup.
- `config-bounds`: enforce `apiBatchSize <= 100` and integer-only semantics.
- `integration-fixtures`: local HTTP server for deterministic downloader and interrupt tests.

### Modified Capabilities
- None.

## Approach

Replace the viewer highlighter with text-node/Range fragments so matched text is wrapped in a `<mark>` element without parsing message strings as HTML. Rebuild the downloader around a small HTTP client that resolves relative `Location` headers, switches protocol clients, caps redirects, retries transient errors with exponential backoff plus jitter, writes to a `.part` file, and renames only on success. Thread a cancellation token through `downloadMedia` and `processChannel`; on SIGINT abort in-flight downloads, delete `.part` files, and exit nonzero. Extend `validateConfig` to reject `apiBatchSize > 100` and non-integers. Strict TDD applies: every implementation task must show RED → GREEN → REFACTOR evidence.

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `templates/viewer.html` | Modified | Replace `innerHTML` search highlight with DOM-safe fragments. |
| `downloader.js` | Modified | Bounded redirect/retry, atomic writes, cleanup. |
| `backup.js` | Modified | Cancellation token, SIGINT cleanup, nonzero exit. |
| `config.js` | Modified | Reject `apiBatchSize > 100` and non-integers. |
| `test/` | New | `downloader.test.js`, `interrupt.test.js`, `viewer-dom.test.js`. |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Atomic write semantics differ by OS | Low | Use `fs.rename` and document no cross-platform guarantees beyond Node's atomic rename. |
| Retry classifies permanent errors as transient | Med | Only retry 5xx, network errors, and 429; fail on 4xx except 429. |
| New viewer highlighter breaks search UX | Low | Preserve existing behavior, test exact match count and clearing. |

## Rollback Plan

Revert the Git commit. The old downloader remains a known fallback; restore it and remove the new test files if tests fail. The viewer change is backward-compatible with existing backup folders.

## Dependencies

- None new; uses Node.js built-in `http`/`https`.

## Success Criteria

- [ ] `npm test` passes, including new downloader, interrupt, and viewer DOM tests.
- [ ] `apiBatchSize > 100` is rejected with a clear error.
- [ ] Interrupted downloads leave no `.part` files and exit with a nonzero code.
- [ ] Malicious message text cannot execute script via search highlight.
