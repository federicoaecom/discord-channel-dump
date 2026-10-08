# Security Policy

Report vulnerabilities privately through [GitHub private vulnerability reporting](https://github.com/federicoaecom/discord-channel-dump/security/advisories/new). Never report them in public issues, pull requests, or discussions.

## Supported versions

Only the latest release receives security fixes.

## How to report

1. Open a [private vulnerability report](https://github.com/federicoaecom/discord-channel-dump/security/advisories/new).
2. Describe the issue, the affected version (`node bin/backup.js --version`), and the steps to reproduce it.
3. Use placeholder or synthetic data in examples.

Never include any of the following in a report:

- Discord tokens or cookies.
- Contents of `browser-profile/`.
- Real message data, attachments, or other content from `backups/`.

## What to expect

- The maintainer acknowledges reports on a best-effort basis, within a reasonable time.
- Fixes are coordinated with the reporter before public disclosure.
- There are no guaranteed response or fix times.

## Scope

| Area | In scope |
|------|----------|
| Session storage | The logged-in Discord session stored locally in `browser-profile/`. |
| Token handling | The Discord authorization token, which the tool keeps in memory for the current run and must never log or write to disk. |
| Offline viewer | The Content Security Policy of the generated `index.html` and any way to bypass it with backed-up content. |
| Backup paths | Path containment: channel folders and downloaded files must stay inside the output directory. |

Report issues in Discord itself to Discord, and issues in Playwright or Chromium to the [Playwright project](https://github.com/microsoft/playwright).

For how the tool handles your session, token, and data, see [Security & Privacy](README.md#security--privacy) in the README.
