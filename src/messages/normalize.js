/**
 * Transform a raw Discord API message into the project's internal message format.
 */

"use strict";

const IMAGE_EXTS = /\.(png|jpe?g|gif|webp|bmp|svg|tiff?)(\?|$)/i;

/**
 * Transform a raw Discord API message into the project's internal message format.
 * @param {Object} m - Raw Discord API message object.
 * @returns {{
 *   msgId: string,
 *   timestamp: string,
 *   author: string | null,
 *   text: string,
 *   images: string[],
 *   attachments: Array<{ label: string, url: string }>
 * }} Normalized message object.
 */
function normalizeMessage(m) {
  const images = [];
  const attachments = [];

  for (const att of m.attachments || []) {
    const url = att.url || att.proxy_url;
    if (!url) continue;
    if (IMAGE_EXTS.test(att.filename || url)) {
      images.push(url);
    } else {
      attachments.push({ label: att.filename || "file", url });
    }
  }

  for (const embed of m.embeds || []) {
    if (embed.image?.url) images.push(embed.image.url);
    if (embed.thumbnail?.url) images.push(embed.thumbnail.url);
    if (embed.video?.url) attachments.push({ label: "video", url: embed.video.url });
  }

  return {
    msgId: m.id,
    timestamp: m.timestamp,
    author: m.author?.global_name || m.author?.username || null,
    text: m.content || "",
    images,
    attachments,
  };
}

module.exports = { normalizeMessage };
