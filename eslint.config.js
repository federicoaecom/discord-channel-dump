"use strict";

const js = require("@eslint/js");
const globals = require("globals");

module.exports = [
  {
    ignores: [
      "node_modules/**",
      "backups/**",
      "browser-profile/**",
      ".github/**",
      "openspec/**",
      ".atl/**",
      ".codegraph/**",
    ],
  },
  js.configs.recommended,
  {
    files: ["**/*.js"],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: "commonjs",
      globals: {
        ...globals.node,
        document: "readonly",
        location: "readonly",
      },
    },
    rules: {
      "no-constant-condition": ["error", { checkLoops: false }],
    },
  },
];
