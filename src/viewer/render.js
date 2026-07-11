/**
 * HTML viewer generation.
 */

"use strict";

const fs = require("fs");
const path = require("path");
const { escapeHtml } = require("../utils/html");
const { iconFor } = require("../utils/icons");

/**
 * Generate an offline HTML viewer for a channel backup.
 * @param {string} channelName - Channel name to display.
 * @param {Array<Object>} messages - Normalized messages.
 * @returns {string} Complete HTML page.
 */
function generateHtml(channelName, messages) {
  const templatePath = path.join(__dirname, "..", "templates", "viewer.html");
  let template = fs.readFileSync(templatePath, "utf8");

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
      const date = msg.timestamp ? new Date(msg.timestamp).toLocaleString("es-AR") : "";
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
            `<a href="${src}" target="_blank" rel="noopener noreferrer"><img class="thumb" src="${src}" alt="img" loading="lazy"></a>`
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

  const generatedAt = new Date().toLocaleString("es-AR");
  const escapedName = escapeHtml(channelName);

  return template
    .replace(/{{CHANNEL_NAME}}/g, () => escapedName)
    .replace(/{{MESSAGE_COUNT}}/g, () => String(messages.length))
    .replace(/{{GENERATED_AT}}/g, () => generatedAt)
    .replace(/{{MIN_DATE}}/g, () => minDate)
    .replace(/{{MAX_DATE}}/g, () => maxDate)
    .replace(/{{ROWS}}/g, () => rows);
}

module.exports = { generateHtml };
