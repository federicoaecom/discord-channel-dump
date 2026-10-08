/**
 * English (en) message dictionary: flat key -> template map.
 *
 * English is also the fallback when a key is missing from another dictionary.
 * Templates use `{name}` placeholders. Keep the key set and placeholders
 * identical to `es.js` (enforced by test/i18n/index.test.js).
 */

"use strict";

module.exports = Object.freeze({
  // Shared CLI messages (bin/backup.js, bin/regen-html.js, src/cli).
  "cli.error": "Error: {message}",
  "cli.fatalError": "Fatal error:",
  "cli.args.missingValue": "Missing value for {option}",
  "cli.args.unknownOption": "Unknown option: {option}",
  "cli.args.unexpectedArgument": "Unexpected argument: {argument}",
  "cli.language.invalid": 'Invalid value for {source}: "{value}". Supported values: {supported}.',
  "cli.language.invalidEnvWarning":
    'Warning: Invalid value for {source}: "{value}". Supported values: {supported}. ' +
    "Using the default language ({default}).",

  // bin/backup.js
  "cli.backup.help": [
    "Usage: node bin/backup.js [options]",
    "",
    "Options:",
    "  -h, --help            Show this help message",
    "  -v, --version         Show version",
    "  -o, --output <dir>    Backup output directory",
    "  -p, --profile <dir>   Browser profile directory",
    "      --lang <code>     Interface language: {supported} (default: {default})",
    "                        (overrides the DISCORD_LANG env var)",
    "      --verbose         Enable debug output",
    "      --dry-run         Fetch message count without saving files",
    "",
    "Examples:",
    "  node bin/backup.js",
    "  node bin/backup.js --output ./my-backups",
    "  node bin/backup.js --profile ./my-profile --output ./my-backups",
    "  node bin/backup.js --dry-run",
    "  node bin/backup.js --lang en",
  ].join("\n"),

  // bin/regen-html.js
  "cli.regen.help": [
    "Usage: node bin/regen-html.js [options] <backup-folder>",
    "",
    "Options:",
    "  -h, --help        Show this help message",
    "  -v, --version     Show version",
    "      --lang <code> Interface language: {supported} (default: {default})",
    "                    (overrides the DISCORD_LANG env var)",
    "",
    "Examples:",
    "  node bin/regen-html.js backups/channel-name",
    "  node bin/regen-html.js --lang en backups/channel-name",
    "  node bin/regen-html.js --help",
  ].join("\n"),
  "cli.regen.missingFolder": "Missing backup-folder argument.",
  "cli.regen.notFound": "Not found: {path}",
  "cli.regen.parseError": "Could not read or parse {path}: {reason}",
  "cli.regen.done": "Done: {path}  ({count} messages)",

  // src/app.js interactive session
  "app.banner": "Discord Channel Dump  v{version} (API mode)",
  "app.profileLabel": "Profile:",
  "app.loginHint": "Log in to Discord if prompted.",
  "app.navigateHint": "Then navigate to any channel and press ENTER.",
  // Typed at the capture prompt to quit. Every language's word is accepted.
  "app.exitCommand": "exit",
  "app.prompt.capture": 'ENTER to capture | "{exit}" to quit: ',
  "app.prompt.confirmName": "Confirm (ENTER) or type a custom name: ",
  "app.tokenMissing":
    "Token not captured yet — make sure Discord is open and loaded, then try again.",
  "app.channelIdMissing": "Could not detect channel ID. Navigate to a channel first.",
  "app.channelId": "Channel ID: {id}",
  "app.channelName": 'Channel name: "{name}"',
  "app.dryRunSummary": "Dry run: would back up {count} messages.",
  "app.done": "Done.",
  "app.shutdown": "Cancelling and cleaning up…",

  // src/output/writer.js
  "writer.images.label": "Images",
  "writer.images.skipTag": "[skip img]",
  "writer.images.done": "Images done:",
  "writer.attachments.label": "Attachments",
  "writer.attachments.skipTag": "[skip att]",
  "writer.attachments.done": "Attachments done:",
  "writer.progress":
    "{processed}/{total} unique | {downloaded} downloaded {reused} reused {failed} failed {elapsed}s",
  "writer.mediaSummary": "{downloaded} downloaded, {reused} reused, {failed} failed.",
  "writer.folder": "Folder: {path}",
  "writer.saved": "Saved",
  "writer.messages": "messages",
  "writer.mediaCounts": "Images: {images} | Attachments: {attachments}",
  "writer.output": "Output: {path}",
  "writer.invalidName.empty":
    'Invalid channel name "{name}": expected a non-empty channel subdirectory',
  "writer.invalidName.reserved": 'Invalid channel name "{name}": reserved on Windows',
  "writer.invalidName.outsideBackupDir":
    'Invalid channel name "{name}": resolved directory must be inside backupDir',

  // src/api/discord.js
  "api.rateLimitWait": "[rate limit] waiting {seconds}s…",
  "api.pageFetched": "Page {page}: {count} messages fetched...",
  "api.error": "API {status}: {text}",

  // src/downloader.js
  "downloader.cancelled": "Download cancelled",
  "downloader.redirectWithoutLocation": "Redirect without Location — {url}",
  "downloader.tooManyRedirects": "Too many redirects — {url}",
  "downloader.httpStatus": "HTTP {status} — {url}",
  "downloader.timeout": "Timeout (>{seconds}s) — {url}",

  // src/config.js validation. {field} is a config field name and stays untranslated.
  "config.notObject": "Configuration must be an object.",
  "config.nonEmptyString": "{field} must be a non-empty string.",
  "config.integerRange": "{field} must be an integer between {min} and {max}",
  "config.nonNegativeNumber": "{field} must be a non-negative number.",
  "config.positiveNumber": "{field} must be a positive number.",
  "config.positiveInteger": "{field} must be a positive integer.",
  "config.boolean": "{field} must be a boolean.",
  "config.oneOf": "{field} must be one of: {values}.",

  // src/viewer/render.js and src/templates/viewer.html (offline viewer).
  "viewer.title": "Backup — #{channel}",
  "viewer.messageCount.one": "{count} message",
  "viewer.messageCount.other": "{count} messages",
  "viewer.searchPlaceholder": "Search the chat…",
  "viewer.dateFrom": "From",
  "viewer.dateTo": "To",
  "viewer.clear": "✕ Clear",
  "viewer.imageAlt": "image",
});
