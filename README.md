# Discord Channel Dump

**English** | [Leer en español](README.es.md)

Back up Discord text channels to your disk: every message as JSON, every image and attachment, and an offline HTML viewer. The tool drives a real Chromium window with Playwright and uses your normal Discord user session, so no bot token or admin permissions are required. The interface is in Spanish by default and can be switched to English.

> **Warning:** automating a user account may violate Discord's Terms of Service (see the [Disclaimer](#disclaimer)), and this project is not affiliated with Discord.

---

## Before you start

You need Node.js, a copy of this project, and a terminal open in its folder. Skip any step you have already done. If an AI assistant is helping you, ask it to read [AGENTS.md](AGENTS.md#if-you-are-helping-someone-use-this-tool) first.

### 1. Install Node.js

Install the current **LTS** version from [nodejs.org](https://nodejs.org/). The tool needs Node.js `^20.19.0`, `^22.13.0`, or `>=24`. Alternatives:

| System | Command |
| --- | --- |
| Windows | `winget install OpenJS.NodeJS.LTS` |
| macOS (Homebrew) | `brew install node` |

Open a new terminal and run `node --version`. It must print a version in the range above, for example `v24.x.x`.

### 2. Get the code

| Option | Best for | How |
| --- | --- | --- |
| **A. Latest release ZIP** (recommended) | Most people | Open the [latest release](https://github.com/federicoaecom/discord-channel-dump/releases/latest), download **Source code (zip)**, and extract it. The folder is named like `discord-channel-dump-2.1.0`. |
| **B. Git clone of a release** | People who use Git | Run the command below, replacing `v2.1.0` with the newest tag on the [releases page](https://github.com/federicoaecom/discord-channel-dump/releases). |
| **C. Development version** | Testing unreleased changes | `git clone` the repository without `--branch`, or use **Code → Download ZIP** on GitHub. This is the `main` branch and may contain unfinished work. |

```bash
git clone --depth 1 --branch v2.1.0 https://github.com/federicoaecom/discord-channel-dump.git
```

### 3. Open a terminal in the project folder

The project folder is the one that contains `package.json` and the `bin` folder. Extracting a ZIP can create a folder inside another folder with the same name; use the inner one.

| System | How |
| --- | --- |
| Windows | In File Explorer, open the folder, right-click an empty area, and choose **Open in Terminal** (Windows 10: hold Shift and choose **Open PowerShell window here**). Or, in PowerShell, run `cd "<path to the folder>"`. |
| macOS | Open **Terminal**, type `cd ` (with a trailing space), drag the folder onto the window, and press **Return**. |
| Linux | Use your file manager's **Open in Terminal** option, or run `cd <path to the folder>`. |

Run `ls` to check: you should see `package.json` in the list.

---

## Quick start

In the terminal from [Before you start](#before-you-start), run:

```bash
npm install
npx playwright install chromium
node bin/backup.js --lang en
```

The second command downloads the Chromium browser and can take a few minutes. The third one opens a browser window. Log in to Discord, open the channel you want, return to the terminal, and press **ENTER**. The backup lands in `backups/<channel-name>/`. Drop `--lang en` to use the default Spanish interface.

---

## Usage

### Per-channel flow

1. Run `node bin/backup.js`. A browser window opens with Discord (already logged in if you used the tool before).
2. **Log in** on the first run. The session is saved to `browser-profile/`.
3. **Open the channel** you want to back up. No scrolling is needed.
4. Return to the terminal and press **ENTER** at the capture prompt:
   - Spanish (default): `ENTER para capturar | "salir" para terminar:`
   - English (`--lang en`): `ENTER to capture | "exit" to quit:`
5. The tool detects the channel name. Press **ENTER** to confirm it or type a custom name.
6. All messages, images, and attachments are downloaded with a progress bar.
7. Repeat from step 3 for each channel.
8. Type `exit` or `salir` (either word works in both languages) to close the browser.

### Options

Run `node bin/backup.js --help` (or `--lang en --help`) for the same list in the terminal.

| Flag | What it does |
| --- | --- |
| `-h`, `--help` | Show the help message. |
| `-v`, `--version` | Show the version. |
| `-o`, `--output <dir>` | Backup output directory. |
| `-p`, `--profile <dir>` | Browser profile directory. |
| `--lang <code>` | Interface language: `es` (default) or `en`. Overrides `DISCORD_LANG`. |
| `--verbose` | Print debug output (`[debug]` lines on stderr). |
| `--dry-run` | Fetch the message count without saving files or downloading media. |

```bash
node bin/backup.js --output ./my-backups
node bin/backup.js -p ./my-profile -o ./my-backups
node bin/backup.js --dry-run --lang en
```

### Environment variables

| Variable              | What it does                                                                                       |
| --------------------- | -------------------------------------------------------------------------------------------------- |
| `DISCORD_LANG`        | Interface language (`es` or `en`). `--lang` wins over it. An invalid value prints a warning and the tool uses `es`. |
| `DISCORD_BACKUP_DIR`  | Backup output directory. `--output` wins over it.                                                  |
| `DISCORD_PROFILE_DIR` | Browser profile directory. `--profile` wins over it.                                               |
| `NO_COLOR`            | Set to `1` to disable colored output.                                                              |

### npm scripts

| Script                    | Runs                                                       |
| ------------------------- | ---------------------------------------------------------- |
| `npm run backup`          | `node bin/backup.js`                                       |
| `npm run regen -- <dir>`  | `node bin/regen-html.js <dir>`                             |
| `npm run install-browser` | `npx playwright install chromium`                          |
| `npm test`                | The test suite (`npm run test:watch` re-runs on changes)   |
| `npm run lint`            | ESLint                                                     |
| `npm run format:check`    | Prettier check (`npm run format` rewrites files)           |

Pass CLI flags after `--`, for example `npm run backup -- --lang en --output ./my-backups`.

### Regenerate the viewer for an existing backup

`bin/regen-html.js` rebuilds `index.html` from an existing `messages.json`. Use it to pick up newer viewer features or to switch the viewer language. It accepts `-h`/`--help`, `-v`/`--version`, and `--lang <code>`.

```bash
# One channel, Spanish viewer (default)
node bin/regen-html.js backups/channel-name

# One channel, English viewer
node bin/regen-html.js backups/channel-name --lang en

# All channels (PowerShell)
Get-ChildItem backups -Directory | ForEach-Object { node bin/regen-html.js "backups/$($_.Name)" }

# All channels (bash)
for dir in backups/*/; do node bin/regen-html.js "$dir"; done
```

When it finishes, it prints a line such as `Done: <path>/index.html  (120 messages)` (`Listo: …` in Spanish).

### Using the installed package

The package exposes one command, `discord-channel-dump`, which runs `bin/backup.js` and accepts the same flags. Run `npx playwright install chromium` once after installing it. `bin/regen-html.js` has no installed command; run it from a clone.

When installed, the default `backups/` and `browser-profile/` folders are created inside the package's own install directory (for example under the global `node_modules`). Reinstalling or uninstalling the package can remove them, so always pass your own folders:

```bash
discord-channel-dump --output ~/discord-backups --profile ~/.discord-channel-dump-profile
```

You can also set `DISCORD_BACKUP_DIR` and `DISCORD_PROFILE_DIR` once instead.

---

## Language

The interface is in **Spanish by default**. To switch to English:

| How                       | Example                                |
| ------------------------- | -------------------------------------- |
| Flag (highest priority)   | `node bin/backup.js --lang en`         |
| Environment variable      | `DISCORD_LANG=en node bin/backup.js` (macOS/Linux) or `$env:DISCORD_LANG = "en"; node bin/backup.js` (PowerShell) |
| Nothing set               | Spanish (`es`)                         |

An invalid `--lang` value is an error: the tool prints the supported values and exits with code 1. The message uses `DISCORD_LANG` when it is valid, otherwise Spanish:

```
Error: Valor no válido para --lang: "fr". Valores admitidos: es, en.
Error: Invalid value for --lang: "fr". Supported values: es, en.
```

An invalid `DISCORD_LANG` value only prints a warning on stderr, and the tool continues in Spanish:

```
Advertencia: valor no válido para DISCORD_LANG: "fr". Valores admitidos: es, en. Se usará el idioma predeterminado (es).
```

What follows the selected language:

- **Terminal output**: help, prompts, progress, summaries, and errors from the Discord API, downloads, and configuration validation. Failed downloads are tagged `[omitido img]` / `[omitido adj]` in Spanish and `[skip img]` / `[skip att]` in English.
- **Offline viewer**: the page `lang` attribute, labels, the pluralized message count, and dates (`es-AR` or `en-US` formatting).

What does not change: `[debug]` lines from `--verbose` stay in English, and the quit words `exit` and `salir` work in both languages.

The viewer language is fixed when `index.html` is written. To change it for an existing backup, regenerate it:

```bash
node bin/regen-html.js backups/channel-name --lang en
```

Scripts that parse the terminal output should pin a language, for example with `DISCORD_LANG=en`.

---

## Output layout

```
backups/
  channel-name/
    messages.json       <- every message, oldest first (JSON array)
    index.html          <- Discord-style offline viewer
    images/
      photo_<sha256>.png
      screenshot_<sha256>.jpg
    attachments/
      report_<sha256>.pdf
      spreadsheet_<sha256>.xlsx
      video_<sha256>.mp4
```

### Media files

Every attachment is downloaded, whatever its type. The only decision is which folder it goes to:

| Folder         | What goes there                                                                                         |
| -------------- | ------------------------------------------------------------------------------------------------------- |
| `images/`      | Attachments whose filename ends in `.png`, `.jpg`, `.jpeg`, `.gif`, `.webp`, `.bmp`, `.svg`, `.tif`, or `.tiff`, plus embed images and thumbnails. |
| `attachments/` | Every other attachment (documents, videos, audio, archives, and so on), plus embed videos.              |

`<sha256>` is the 64-character lowercase SHA-256 digest of the canonical media identity: the URL origin and path plus the remaining query parameters in sorted order. Volatile Discord CDN signature parameters (`ex`, `is`, `hm`, matched case-insensitively) and URL fragments are ignored, so rotating signatures reuse the same file instead of downloading duplicates. Every other query parameter keeps resources distinct, even when they share a filename. Media filenames are limited to 255 UTF-8 bytes by truncating the readable basename when necessary; the extension is retained whenever the hash suffix and extension fit.

### `messages.json`

The file is a JSON array of messages, sorted oldest first. `author` is the display name, falling back to the username, and is `null` when Discord provides neither. `localImages` and `localAttachments` list only the files that were saved successfully.

```json
[
  {
    "msgId": "1234567890",
    "timestamp": "2024-03-15T14:32:00.000Z",
    "author": "Username",
    "text": "Message content",
    "images": ["https://cdn.discordapp.com/..."],
    "attachments": [{ "label": "file.pdf", "url": "https://..." }],
    "localImages": ["images/photo_<sha256>.png"],
    "localAttachments": [{ "label": "file.pdf", "path": "attachments/file_<sha256>.pdf" }]
  }
]
```

### Offline viewer (`index.html`)

- **Real-time search** filters messages by text or author and highlights matches.
- **Date range filter** with "from" and "to" dates that combine with the search.
- **Ctrl+F** (or Cmd+F) focuses the built-in search instead of the browser's find dialog.
- **Clear button** resets all filters at once.
- Works completely **offline**: no internet connection or server required.

---

## How it works

Instead of scrolling the Discord page (fragile and slow), the tool reads Discord's own **REST API**:

```
1. Chromium (Playwright) opens Discord with your saved profile.
2. The tool reads your token from the Authorization header of the web app's own API requests.
3. Node.js calls the API with that token through Playwright's request context:
     GET /api/v9/channels/{id}/messages?limit=50&before={id}
   and paginates back to the first message.
4. Media is downloaded from the CDN, then messages.json and index.html are written.
```

This fetches **every message** without scroll or timing issues. The API requests run in the Node.js process (Playwright's `context.request`), not inside the web page.

The browser opens **once per run** and stays logged in between runs thanks to the persistent profile in `browser-profile/`, so you do not need to log in every time.

---

## Configuration

Most people only need the flags and environment variables above. The remaining tunables live in [src/config.js](src/config.js), which is the single source of truth and validates every value on startup:

| Setting             | Default            | Meaning                                                                         |
| ------------------- | ------------------ | ------------------------------------------------------------------------------- |
| `backupDir`         | `backups/`         | Output directory (`--output`, `DISCORD_BACKUP_DIR`).                            |
| `profileDir`        | `browser-profile/` | Browser profile directory (`--profile`, `DISCORD_PROFILE_DIR`).                 |
| `apiBatchSize`      | `50`               | Messages per API request (integer from 1 to 100).                               |
| `apiDelayMs`        | `400`              | Pause between API pages, in milliseconds.                                       |
| `downloadTimeoutMs` | `20000`            | Timeout for each download request, in milliseconds.                             |
| `maxRetries`        | `3`                | Retries for a download after a network error, timeout, HTTP 429, or HTTP 5xx.   |
| `maxRedirects`      | `10`               | Redirects followed per download.                                                |
| `retryDelayMs`      | `1000`             | Base retry delay, doubled on each retry.                                        |
| `jitterMaxMs`       | `500`              | Maximum random delay added to each retry.                                       |
| `dryRun`            | `false`            | Set by `--dry-run`.                                                             |
| `language`          | `es`               | Set by `--lang` or `DISCORD_LANG`.                                              |

`backups/` and `browser-profile/` are relative to the project (or package) root. If Discord rate-limits the API, the tool waits the time Discord asks for and retries; raise `apiDelayMs` to `800` or `1000` if it happens often. A download that still fails after its retries is tagged as skipped and the backup continues.

---

## Security & Privacy

| What | Where | What to do |
|------|-------|------------|
| Logged-in Discord session (cookies and the Discord web app's own site data) | `browser-profile/` | Treat it like a password. Never commit or share it. Delete the folder to log out. |
| Discord authorization token captured by the tool | Process memory, for the current run | Nothing to do. The tool does not log it or write it to disk. |
| Private message content and attachments | `backups/` | Store and share it with the same care as the original conversations. |

- **Token handling**: the tool reads the token from the `Authorization` header of the requests that the Discord web app sends to `discord.com/api`. It keeps the token in memory for the current run and sends it only with its own Discord API requests, which run in the Node.js process through Playwright. Media downloads from the CDN do not include it.
- **Git**: `backups/` and `browser-profile/` are listed in `.gitignore`. If you change their location with `--output`, `--profile`, or environment variables, keep the new folders out of version control yourself.

### Disclaimer

- Automating a user account may violate [Discord's Terms of Service](https://discord.com/terms). Use this tool at your own risk.
- Back up only content that you have the right to access and keep.
- This project is not affiliated with, endorsed by, or sponsored by Discord.

---

## Troubleshooting

Messages are shown in Spanish first, then English.

| Message or symptom | Cause and fix |
| ------------------ | ------------- |
| `Aún no se capturó el token…` / `Token not captured yet…` | Discord is not loaded or you are not logged in. Log in, wait for Discord to load, and press ENTER again. |
| `No se pudo detectar el ID del canal…` / `Could not detect channel ID…` | The current page is not a channel. Open a channel URL that contains `/channels/`. |
| `La API respondió 403` / `API 403` | Your account cannot access that channel. The run stops with a fatal error; start it again and open another channel. |
| `[límite de solicitudes] esperando…` / `[rate limit] waiting…` | Discord is rate-limiting. The tool waits and retries; raise `apiDelayMs` in [src/config.js](src/config.js) to `800` or `1000` if it happens often. |
| `[omitido img]` / `[skip img]` or `[omitido adj]` / `[skip att]` with `HTTP 404` or `HTTP 403` | The link expired or is not downloadable. Discord CDN links expire after a while (usually several days), so back up channels while the links are valid. Links to Google Docs or Notion that return 403 are expected to fail. |
| `Valor no válido para --lang` / `Invalid value for --lang` | Use `--lang es` or `--lang en`. |
| `Failed to create a ProcessSingleton` on startup | A previous run did not shut down cleanly and left a lock in the profile. Delete `browser-profile/SingletonLock` and run the tool again. |

---

## Notes

- Re-running a channel is safe: media files that already exist are **reused**, not downloaded again. Only `messages.json` and `index.html` are overwritten. Backups created before the current filename scheme download their media again; see the upgrade notes in [CHANGELOG.md](CHANGELOG.md).
- Channel folders are named from the channel name, with characters that are invalid on Windows sanitized.
- `browser-profile/` holds your Chromium session. Deleting it logs you out.
- `backups/` and `browser-profile/` are preserved runtime directories; source cleanup and restructuring never move or delete them.

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md).

## Changelog

See [CHANGELOG.md](CHANGELOG.md).
