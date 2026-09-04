#!/usr/bin/env node
/**
 * Discord Channel Dump — CLI entry point.
 *
 * All business logic lives in `src/app.js`. This file only parses arguments,
 * validates config, registers shutdown handlers, and starts the session.
 */

"use strict";

const path = require("path");
const config = require("../src/config");
const logger = require("../src/ui/logger");
const { createCancelToken } = require("../src/cancel-token");
const { parseCliArgs, printHelp, printVersion } = require("../src/cli/backup-args");
const { runBrowserSession } = require("../src/app");

const sharedCancelToken = createCancelToken();

function applyOverrides(config, args) {
  const overrides = {};
  if (args.output) {
    overrides.backupDir = path.resolve(args.output);
  }
  if (args.profile) {
    overrides.profileDir = path.resolve(args.profile);
  }
  return Object.freeze({ ...config, ...overrides });
}

function handleFatalError(error) {
  logger.error("Fatal error:", error.stack || error.message);
  process.exit(1);
}

async function main(argv, runSession = runBrowserSession) {
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

  logger.setVerbose(args.verbose);

  try {
    const cfg = applyOverrides(config.loadConfig({ dryRun: args.dryRun }), args);

    try {
      config.validateConfig(cfg);
    } catch (e) {
      if (e instanceof config.ConfigError) {
        logger.error(`Error: ${e.message}`);
        process.exit(1);
      }
      throw e;
    }

    logger.debug(`[debug] Output directory: ${path.resolve(cfg.backupDir)}`);
    logger.debug(`[debug] Profile directory: ${path.resolve(cfg.profileDir)}`);
    logger.debug(`[debug] Dry run: ${cfg.dryRun ? "enabled" : "disabled"}`);

    await runSession(cfg, sharedCancelToken);
  } finally {
    logger.setVerbose(false);
  }
}

if (require.main === module) {
  main(process.argv.slice(2)).catch(handleFatalError);
}

module.exports = {
  parseCliArgs,
  applyOverrides,
  handleFatalError,
  main,
};
