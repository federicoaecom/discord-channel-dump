/**
 * Regenerate index.html for an existing backup folder using the
 * current generateHtml logic (search + date range filter).
 *
 * Usage:
 *   node bin/regen-html.js [options] <path-to-backup-folder>
 *
 * Options:
 *   -h, --help      Show this help message
 *   -v, --version   Show version
 *
 * Examples:
 *   node bin/regen-html.js backups/channel-name
 *   node bin/regen-html.js --help
 */

"use strict";

const fs = require("fs");
const path = require("path");
const pkg = require("../package.json");
const logger = require("../src/ui/logger");
const { generateHtml } = require("../src/viewer/render");

function printHelp() {
  logger.info(`
Usage: node bin/regen-html.js [options] <backup-folder>

Options:
  -h, --help      Show this help message
  -v, --version   Show version

Examples:
  node bin/regen-html.js backups/channel-name
  node bin/regen-html.js --help
`);
}

function printVersion() {
  logger.info(pkg.version);
}

function parseCliArgs(argv) {
  const result = { help: false, version: false, _: [] };
  let i = 0;
  while (i < argv.length) {
    const arg = argv[i];
    if (arg === "--help" || arg === "-h") {
      result.help = true;
    } else if (arg === "--version" || arg === "-v") {
      result.version = true;
    } else if (arg.startsWith("-")) {
      return { error: `Unknown option: ${arg}` };
    } else {
      result._.push(arg);
    }
    i++;
  }
  return result;
}

async function main(argv) {
  const args = parseCliArgs(argv);
  if (args.error) {
    logger.error(`Error: ${args.error}`);
    printHelp();
    process.exit(1);
  }
  if (args.help) {
    printHelp();
    process.exit(0);
  }
  if (args.version) {
    printVersion();
    process.exit(0);
  }

  const target = args._[0];
  if (!target) {
    logger.error("Error: Missing backup-folder argument.");
    printHelp();
    process.exit(1);
  }

  const jsonPath = path.resolve(target, "messages.json");
  const htmlPath = path.resolve(target, "index.html");

  if (!fs.existsSync(jsonPath)) {
    logger.error(`Not found: ${jsonPath}`);
    process.exit(1);
  }

  let messages;
  try {
    messages = JSON.parse(fs.readFileSync(jsonPath, "utf8"));
  } catch (e) {
    logger.error(`Error: Could not read or parse ${jsonPath}: ${e.message}`);
    process.exit(1);
  }

  const channelName = path.basename(path.resolve(target));

  fs.writeFileSync(htmlPath, generateHtml(channelName, messages), "utf8");
  logger.info(`  Done: ${htmlPath}  (${messages.length} messages)`);
}

if (require.main === module) {
  main(process.argv.slice(2)).catch((err) => {
    logger.error("Fatal error:", err.message);
    process.exit(1);
  });
}

module.exports = { parseCliArgs };
