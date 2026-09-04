# Discord Channel Dump

Discord channel backup tool using Playwright browser automation. No bot token or admin permissions are required — it uses your normal Discord user session.

---

## How It Works

Instead of scrolling the DOM (fragile and slow), the tool calls Discord's own **REST API** directly from the authenticated browser:

```
Your browser session  ->  GET /api/v9/channels/{id}/messages?limit=50&before={id}
                       ->  automatic pagination back to the first message
```

This fetches **100% of the messages** without timing or scroll issues.

The browser opens **once** and stays authenticated between runs thanks to the persistent profile stored in `browser-profile/`. You do not need to log in every time.

---

## Installation (First Time)

Requires Node.js `^20.19.0`, `^22.13.0`, or `>=24`.

```bash
npm install
npx playwright install chromium
```

---

## Usage

```bash
node bin/backup.js
```

### Per-Channel Flow

1. A browser window opens with Discord (already logged in if you have used the tool before).
2. **Log in** if this is the first run — cookies are saved to `browser-profile/`.
3. **Navigate to the channel** you want to back up (no scrolling required).
4. Return to the terminal and press **ENTER**.
5. The script detects the channel name — confirm it or type a custom one.
6. All messages, images, and attachments are downloaded with real-time progress.
7. Repeat from step 3 for each channel.
8. Type `exit` to close the browser.

### Optional CLI Flags

```bash
node bin/backup.js --help
node bin/backup.js --version
node bin/backup.js --verbose
node bin/backup.js --dry-run
node bin/backup.js --output ./my-backups
node bin/backup.js --profile ./my-profile --output ./my-backups
```

- `--verbose` enables debug-level logging.
- `--dry-run` fetches the message count without writing files or downloading media.

---

## Regenerate HTML for an Existing Backup

To update `index.html` for backups created before new viewer features were added (for example, search or date filtering):

```bash
# One channel
node bin/regen-html.js backups/channel-name

# All channels (PowerShell)
Get-ChildItem backups -Directory | ForEach-Object { node bin/regen-html.js "backups/$($_.Name)" }

# All channels (bash)
for dir in backups/*/; do node bin/regen-html.js "$dir"; done
```

---

## Output Structure

```
backups/
  channel-name/
    messages.json       <- structured messages (JSON)
    index.html          <- Discord-style offline viewer
    images/
      photo_<sha256>.png
      screenshot_<sha256>.jpg
    attachments/
      report_<sha256>.pdf
      spreadsheet_<sha256>.xlsx
      video_<sha256>.mp4
```

`<sha256>` represents the 64-character lowercase SHA-256 digest of the canonical media identity: the URL origin and path plus the remaining query parameters in sorted order. Volatile Discord CDN signature parameters (`ex`, `is`, `hm`, matched case-insensitively) and URL fragments are ignored, so rotating signatures reuse the same file instead of downloading duplicates. Every other query parameter keeps resources distinct, even when they share a filename. Media filenames are limited to 255 UTF-8 bytes by truncating the readable basename when necessary; the extension is retained whenever the hash suffix and extension fit.

### HTML Viewer (`index.html`)

The viewer includes:

- **Real-time search** — filters messages by text or author, with match highlighting.
- **Date range filter** — From / To selectors that combine with search.
- **Ctrl+F** — redirects to the internal search instead of the browser find dialog.
- **Clear button** — resets all filters at once.
- Works completely **offline** — no internet or server required.

### `messages.json` — Message Format

```json
{
  "msgId": "1234567890",
  "timestamp": "2024-03-15T14:32:00.000Z",
  "author": "Username",
  "text": "Message content",
  "images": ["https://cdn.discordapp.com/..."],
  "attachments": [{ "label": "file.pdf", "url": "https://..." }],
  "localImages": ["images/photo_<sha256>.png"],
  "localAttachments": [
    { "label": "file.pdf", "path": "attachments/file_<sha256>.pdf" }
  ]
}
```

---

## Configuration

All tunable options are centralized in [src/config.js](src/config.js):

```js
module.exports = {
  backupDir: path.join(__dirname, "..", "backups"),      // Output directory
  profileDir: path.join(__dirname, "..", "browser-profile"), // Browser session
  apiBatchSize: 50,      // Messages per request (Discord max = 100)
  apiDelayMs: 400,       // Pause in ms between pages (avoids rate limits)
  downloadTimeoutMs: 20000, // Timeout in ms for each file download
};
```

If Discord returns HTTP 429 (rate limit), increase `apiDelayMs` to `800` or `1000`.
Files that exceed `downloadTimeoutMs` are marked as `[skip]` and the process continues.

Directory paths can also be overridden with environment variables (`DISCORD_BACKUP_DIR` and `DISCORD_PROFILE_DIR`).

---

## Downloaded File Types

| Type        | Examples                   |
|-------------|----------------------------|
| Images      | PNG, JPG, GIF, WEBP        |
| Documents   | PDF, DOCX, XLSX, PPTX      |
| Videos      | MP4, MOV, AVI, MKV         |
| Audio       | MP3, WAV, OGG, FLAC        |
| Archives    | ZIP, RAR, 7Z               |
| Other       | TXT, CSV, JSON, EXE        |

---

## Troubleshooting

### "Token not captured yet"

The browser is not logged in to Discord. Log in and try again.

### "Could not detect channel ID"

The current URL is not a text channel. Make sure you are in a channel URL that contains `/channels/`.

### HTTP 403 from the API

Your account does not have access to that channel.

### HTTP 429 (rate limit)

Increase `apiDelayMs` in `src/config.js` to `800` or `1000`.

### Images return 404 when downloaded

Discord CDN links expire after a while. Back up the channel while the links are still valid (they usually last several days).
Links from Google Docs or Notion that return 403 are not downloadable — this is expected.

### "Failed to create a ProcessSingleton" on startup

The previous run did not shut down cleanly and left a lock in `browser-profile/`.
Delete the file `browser-profile/SingletonLock` and run the script again.

---

## Notes

- The backup **skips files that already exist** on disk — it is safe to re-run on a channel that was already processed. Only `messages.json` and `index.html` are overwritten.
- Folders are named from the channel name, with invalid Windows characters sanitized.
- The `browser-profile/` folder contains your Chrome session — do not delete it or you will lose the saved authentication.
- `backups/` and `browser-profile/` are preserved runtime directories; source cleanup and restructuring never move or delete them.

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md).

## Changelog

See [CHANGELOG.md](CHANGELOG.md).
