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
  "app.prompt.capture": 'ENTER to capture | "exit" to quit: ',
  "app.prompt.confirmName": "Confirm (ENTER) or type a custom name: ",
  "app.tokenMissing":
    "Token not captured yet — make sure Discord is open and loaded, then try again.",
  "app.channelIdMissing": "Could not detect channel ID. Navigate to a channel first.",
  "app.channelId": "Channel ID: {id}",
  "app.channelName": 'Channel name: "{name}"',
  "app.dryRunSummary": "Dry run: would back up {count} messages.",
  "app.done": "Done.",
  "app.shutdown": "Cancelling and cleaning up…",
});
