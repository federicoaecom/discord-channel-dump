/**
 * HTML viewer generation.
 */

"use strict";

const fs = require("fs");
const path = require("path");
const { escapeHtml } = require("../utils/html");
const { iconFor } = require("../utils/icons");
// Keep the module object (no destructuring) so translations resolve per call.
const i18n = require("../i18n");

/** Matches a `{{NAME}}` template placeholder. */
const PLACEHOLDER = /{{([A-Z_]+)}}/g;

/**
 * Fill every `{{NAME}}` placeholder in a single pass. Inserted values are never
 * scanned again, and the function-form replacement keeps `$` patterns literal.
 * Unknown placeholders are left untouched.
 * @param {string} template - Template text.
 * @param {Record<string, string>} values - Already-escaped values by placeholder name.
 * @returns {string} The filled template.
 */
function fillTemplate(template, values) {
  return template.replace(PLACEHOLDER, (match, name) =>
    Object.hasOwn(values, name) ? values[name] : match
  );
}

/**
 * Generate an offline HTML viewer for a channel backup.
 * @param {string} channelName - Channel name to display.
 * @param {Array<Object>} messages - Normalized messages.
 * @param {{ lang?: "es" | "en" }} [options] - `lang` selects the viewer language
 *   (labels, `lang` attribute, and date locale); defaults to the active language.
 * @returns {string} Complete HTML page.
 * @throws {RangeError} When `options.lang` is not a supported language.
 */
function generateHtml(channelName, messages, options = {}) {
  const lang = options.lang ?? i18n.getLanguage();
  if (!i18n.SUPPORTED_LANGUAGES.includes(lang)) {
    throw new RangeError(`Unsupported language: ${lang}`);
  }
  const locale = i18n.getLocale(lang);
  const text = (key, params) => escapeHtml(i18n.translateIn(lang, key, params));
  const imageAlt = text("viewer.imageAlt");

  const templatePath = path.join(__dirname, "..", "templates", "viewer.html");
  const template = fs.readFileSync(templatePath, "utf8");

  // Compute date bounds for placeholder hints on the date inputs.
  const timestamps = messages
    .map((m) => (m.timestamp ? new Date(m.timestamp).getTime() : 0))
    .filter(Boolean);
  const minDate = timestamps.length
    ? new Date(Math.min(...timestamps)).toISOString().slice(0, 10)
    : "";
  const maxDate = timestamps.length
    ? new Date(Math.max(...timestamps)).toISOString().slice(0, 10)
    : "";

  const rows = messages
    .map((msg) => {
      const date = msg.timestamp ? new Date(msg.timestamp).toLocaleString(locale) : "";
      const tsMs = msg.timestamp ? new Date(msg.timestamp).getTime() : 0;
      const authorTxt = msg.author || "";
      const author = authorTxt
        ? `<span class="author">${escapeHtml(authorTxt)}</span>`
        : `<span class="author sys">—</span>`;
      const textHtml = msg.text
        ? `<p class="text">${escapeHtml(msg.text).replace(/\n/g, "<br>")}</p>`
        : "";
      const imgHtml = (msg.localImages || [])
        .map(
          (src) =>
            `<a href="${src}" target="_blank" rel="noopener noreferrer"><img class="thumb" src="${src}" alt="${imageAlt}" loading="lazy"></a>`
        )
        .join("");
      const attHtml = (msg.localAttachments || [])
        .map(
          (a) =>
            `<a class="att" href="${escapeHtml(a.path)}" target="_blank" rel="noopener noreferrer">${iconFor(a.path)} ${escapeHtml(a.label)}</a>`
        )
        .join("");

      const searchable = escapeHtml(`${authorTxt} ${msg.text || ""}`.toLowerCase());

      return `
  <div class="msg" data-search="${searchable}" data-ts="${tsMs}">
    <div class="meta">${author}<span class="date">${date}</span></div>
    ${textHtml}
    ${imgHtml ? `<div class="imgs">${imgHtml}</div>` : ""}
    ${attHtml ? `<div class="atts">${attHtml}</div>` : ""}
  </div>`;
    })
    .join("\n");

  const count = messages.length;

  return fillTemplate(template, {
    LANG: escapeHtml(lang),
    TITLE: text("viewer.title", { channel: channelName }),
    CHANNEL_NAME: escapeHtml(channelName),
    MESSAGE_COUNT_LABEL: text(i18n.pluralKey("viewer.messageCount", count), { count }),
    GENERATED_AT: escapeHtml(new Date().toLocaleString(locale)),
    SEARCH_PLACEHOLDER: text("viewer.searchPlaceholder"),
    DATE_FROM_LABEL: text("viewer.dateFrom"),
    DATE_TO_LABEL: text("viewer.dateTo"),
    CLEAR_LABEL: text("viewer.clear"),
    MIN_DATE: minDate,
    MAX_DATE: maxDate,
    ROWS: rows,
  });
}

module.exports = { generateHtml };
