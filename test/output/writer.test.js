const { describe, it, beforeEach, afterEach } = require("node:test");
const assert = require("node:assert/strict");
const { createHash } = require("crypto");
const fs = require("fs");
const path = require("path");
const { saveChannel, downloadMedia } = require("../../src/output/writer.js");
const { DEFAULT_LANGUAGE, setLanguage } = require("../../src/i18n");
const { createTempDirs } = require("../helpers/temp-dirs.js");

// Every directory created by tmpDir(), removed after each test.
const temp = createTempDirs();

// The active language is module-level state; reset it so tests stay independent.
afterEach(() => {
  setLanguage(DEFAULT_LANGUAGE);
  temp.cleanup();
});

/**
 * Create a temporary directory that is removed after the current test.
 * @returns {string} The directory path.
 */
function tmpDir() {
  return temp.make("writer-");
}

/**
 * Run an async function while capturing everything written to stdout.
 * @param {() => Promise<unknown>} fn - Function to run.
 * @returns {Promise<{ output: string, result: unknown }>} Captured output and result.
 */
async function captureStdout(fn) {
  const chunks = [];
  const originalWrite = process.stdout.write;
  process.stdout.write = (chunk) => {
    chunks.push(String(chunk));
    return true;
  };
  try {
    const result = await fn();
    return { output: chunks.join(""), result };
  } finally {
    process.stdout.write = originalWrite;
  }
}

describe("saveChannel", () => {
  // These tests assert the English text; the Spanish default is covered below.
  beforeEach(() => {
    setLanguage("en");
  });

  async function generatedImageFilename(sourceName) {
    const dir = tmpDir();
    const imagesDir = path.join(dir, "images");
    const attachmentsDir = path.join(dir, "attachments");
    const url = `https://cdn.example.com/${encodeURIComponent(sourceName)}`;
    const messages = [{ images: [url], attachments: [] }];
    let filename;

    try {
      await downloadMedia(messages, imagesDir, attachmentsDir, null, async (_url, dest) => {
        filename = path.basename(dest);
      });
      return { filename, url };
    } finally {
      fs.rmSync(dir, { recursive: true, force: true });
    }
  }

  async function assertRejectedWithoutWrites(channelName, expectedError) {
    const parentDir = tmpDir();
    const backupDir = path.join(parentDir, "backups");

    try {
      await assert.rejects(
        saveChannel(channelName, [], { backupDir }, null, fakeDownloadMedia),
        expectedError
      );
      assert.deepEqual(fs.readdirSync(parentDir), []);
    } finally {
      fs.rmSync(parentDir, { recursive: true, force: true });
    }
  }

  // eslint-disable-next-line no-unused-vars
  function fakeDownloadMedia(messages, imagesDir, attachmentsDir, _) {
    for (const m of messages) {
      m.localImages = [];
      for (const imgUrl of m.images || []) {
        const fname = `img_${path.basename(imgUrl)}`;
        fs.writeFileSync(path.join(imagesDir, fname), "image-data");
        m.localImages.push(path.posix.join("images", fname));
      }
      m.localAttachments = [];
      for (const att of m.attachments || []) {
        const fname = `att_${path.basename(att.url)}`;
        fs.writeFileSync(path.join(attachmentsDir, fname), "attachment-data");
        m.localAttachments.push({ label: att.label, path: path.posix.join("attachments", fname) });
      }
    }
  }

  it("creates channel files and writes messages.json and index.html", async () => {
    const dir = tmpDir();
    const config = { backupDir: dir };
    const messages = [
      {
        msgId: "1",
        timestamp: "2024-01-01T12:00:00.000Z",
        author: "Alice",
        text: "hello",
        images: ["https://cdn.example.com/photo.png"],
        attachments: [{ label: "doc.pdf", url: "https://cdn.example.com/doc.pdf" }],
      },
    ];

    const result = await saveChannel("test-channel", messages, config, null, fakeDownloadMedia);

    const channelDir = path.resolve(dir, "test-channel");
    assert.equal(fs.existsSync(path.join(channelDir, "messages.json")), true);
    assert.equal(fs.existsSync(path.join(channelDir, "index.html")), true);
    assert.equal(fs.existsSync(path.join(channelDir, "images", "img_photo.png")), true);
    assert.equal(fs.existsSync(path.join(channelDir, "attachments", "att_doc.pdf")), true);
    assert.equal(result.messageCount, 1);
    assert.equal(result.imageCount, 1);
    assert.equal(result.attachmentCount, 1);
    assert.equal(result.channelDir, channelDir);
  });

  it("writes index.html in the active language (English)", async () => {
    const dir = tmpDir();
    try {
      const messages = [{ msgId: "1", timestamp: "2024-01-01T12:00:00.000Z", text: "hi" }];
      await captureStdout(() =>
        saveChannel("viewer-en", messages, { backupDir: dir }, null, fakeDownloadMedia)
      );
      const html = fs.readFileSync(path.join(dir, "viewer-en", "index.html"), "utf8");
      assert.match(html, /<html lang="en">/);
      assert.match(html, /placeholder="Search the chat…"/);
      assert.match(html, /<span class="header-meta">1 message &mdash; /);
    } finally {
      fs.rmSync(dir, { recursive: true, force: true });
    }
  });

  it("sanitizes the channel name for the directory", async () => {
    const dir = tmpDir();
    const config = { backupDir: dir };
    const messages = [{ msgId: "1", timestamp: "2024-01-01T12:00:00.000Z", text: "" }];

    await saveChannel("bad:name?", messages, config, null, fakeDownloadMedia);

    assert.equal(fs.existsSync(path.join(dir, "bad_name_", "messages.json")), true);
  });

  for (const channelName of ["###", ".", ".."]) {
    it(`rejects invalid sanitized channel name ${JSON.stringify(channelName)}`, async () => {
      await assertRejectedWithoutWrites(channelName, /expected a non-empty channel subdirectory/);
    });
  }

  it("rejects Windows reserved names without writing", async () => {
    const reservedNames = [
      "CON",
      "prn.txt",
      "AUX.",
      "nul   ",
      "COM1.json",
      "com9... ",
      "LPT1.backup",
      "lpt9. ",
    ];

    for (const channelName of reservedNames) {
      await assertRejectedWithoutWrites(channelName, /reserved on Windows/);
    }
  });

  it("downloads each source once and reuses exact paths on rerun", async () => {
    const dir = tmpDir();
    const imagesDir = path.join(dir, "images");
    const attachmentsDir = path.join(dir, "attachments");
    fs.mkdirSync(imagesDir, { recursive: true });
    fs.mkdirSync(attachmentsDir, { recursive: true });

    const imageUrl = "https://cdn.example.com/photo.png";
    const attachmentUrl = "https://cdn.example.com/report.pdf";
    const messages = [
      {
        images: [imageUrl, imageUrl],
        attachments: [{ label: "first", url: attachmentUrl }],
      },
      {
        images: [imageUrl],
        attachments: [{ label: "second", url: attachmentUrl }],
      },
    ];

    const downloads = [];
    async function fakeDownloadFile(url, dest) {
      downloads.push(url);
      fs.writeFileSync(dest, url);
    }

    await downloadMedia(messages, imagesDir, attachmentsDir, null, fakeDownloadFile);
    const firstPaths = messages.map((message) => ({
      images: [...message.localImages],
      attachments: message.localAttachments.map((attachment) => ({ ...attachment })),
    }));

    assert.deepEqual(downloads, [imageUrl, attachmentUrl]);
    assert.match(messages[0].localImages[0], /^images\/photo_[0-9a-f]{64}\.png$/);
    assert.equal(messages[0].localImages[1], messages[0].localImages[0]);
    assert.match(messages[1].localAttachments[0].path, /^attachments\/report_[0-9a-f]{64}\.pdf$/);

    await downloadMedia(messages, imagesDir, attachmentsDir, null, fakeDownloadFile);

    assert.equal(downloads.length, 2);
    assert.deepEqual(
      messages.map((message) => ({
        images: message.localImages,
        attachments: message.localAttachments,
      })),
      firstPaths
    );
  });

  it("does not reuse stale bytes when a later source shares the basename", async () => {
    const dir = tmpDir();
    const imagesDir = path.join(dir, "images");
    const attachmentsDir = path.join(dir, "attachments");
    fs.mkdirSync(imagesDir, { recursive: true });
    fs.mkdirSync(attachmentsDir, { recursive: true });

    const urlA = "https://a.example.com/media/photo.png";
    const urlB = "https://b.example.com/archive/photo.png";
    const downloads = [];
    async function fakeDownloadFile(url, dest) {
      downloads.push(url);
      fs.writeFileSync(dest, url);
    }

    const firstRun = [{ images: [urlA], attachments: [] }];
    await downloadMedia(firstRun, imagesDir, attachmentsDir, null, fakeDownloadFile);

    const secondRun = [{ images: [urlB], attachments: [] }];
    await downloadMedia(secondRun, imagesDir, attachmentsDir, null, fakeDownloadFile);

    assert.deepEqual(downloads, [urlA, urlB]);
    assert.notEqual(secondRun[0].localImages[0], firstRun[0].localImages[0]);
    assert.equal(fs.readFileSync(path.join(dir, secondRun[0].localImages[0]), "utf8"), urlB);
  });

  it("reuses the same path when only volatile CDN signatures rotate", async () => {
    const dir = tmpDir();
    const imagesDir = path.join(dir, "images");
    const attachmentsDir = path.join(dir, "attachments");
    fs.mkdirSync(imagesDir, { recursive: true });
    fs.mkdirSync(attachmentsDir, { recursive: true });

    const base = "https://cdn.discordapp.com/attachments/123/456/photo.png";
    const urlA = `${base}?ex=111&is=aaa&hm=xxx`;
    const urlB = `${base}?hm=yyy&ex=222&is=bbb`;
    const downloads = [];
    async function fakeDownloadFile(url, dest) {
      downloads.push(url);
      fs.writeFileSync(dest, url);
    }

    const firstRun = [{ images: [urlA], attachments: [] }];
    await downloadMedia(firstRun, imagesDir, attachmentsDir, null, fakeDownloadFile);

    const secondRun = [{ images: [urlB], attachments: [] }];
    await downloadMedia(secondRun, imagesDir, attachmentsDir, null, fakeDownloadFile);

    assert.deepEqual(downloads, [urlA]);
    assert.equal(secondRun[0].localImages[0], firstRun[0].localImages[0]);
    assert.equal(fs.readFileSync(path.join(dir, secondRun[0].localImages[0]), "utf8"), urlA);
  });

  it("keeps meaningful query parameters distinct", async () => {
    const dir = tmpDir();
    const imagesDir = path.join(dir, "images");
    const attachmentsDir = path.join(dir, "attachments");
    fs.mkdirSync(imagesDir, { recursive: true });
    fs.mkdirSync(attachmentsDir, { recursive: true });

    const urlA = "https://cdn.example.com/photo.png?size=100";
    const urlB = "https://cdn.example.com/photo.png?size=200";
    const downloads = [];
    async function fakeDownloadFile(url, dest) {
      downloads.push(url);
      fs.writeFileSync(dest, url);
    }

    const firstRun = [{ images: [urlA], attachments: [] }];
    await downloadMedia(firstRun, imagesDir, attachmentsDir, null, fakeDownloadFile);

    const secondRun = [{ images: [urlB], attachments: [] }];
    await downloadMedia(secondRun, imagesDir, attachmentsDir, null, fakeDownloadFile);

    assert.deepEqual(downloads, [urlA, urlB]);
    assert.notEqual(secondRun[0].localImages[0], firstRun[0].localImages[0]);
    assert.equal(fs.readFileSync(path.join(dir, secondRun[0].localImages[0]), "utf8"), urlB);
  });

  it("bounds long ASCII media filenames to 255 UTF-8 bytes", async () => {
    const { filename, url } = await generatedImageFilename(`${"a".repeat(300)}.png`);
    const digest = createHash("sha256").update(url).digest("hex");

    assert.equal(Buffer.byteLength(filename, "utf8"), 255);
    assert.equal(filename, `${"a".repeat(186)}_${digest}.png`);
  });

  it("truncates multibyte media names only at code point boundaries", async () => {
    const { filename, url } = await generatedImageFilename(`${"😀".repeat(100)}.webp`);
    const digest = createHash("sha256").update(url).digest("hex");

    assert.equal(Buffer.byteLength(filename, "utf8"), 254);
    assert.equal(filename, `${"😀".repeat(46)}_${digest}.webp`);
  });

  it("writes messages.json with local paths", async () => {
    const dir = tmpDir();
    const config = { backupDir: dir };
    const messages = [
      {
        msgId: "1",
        timestamp: "2024-01-01T12:00:00.000Z",
        author: "Bob",
        text: "with image",
        images: ["https://cdn.example.com/photo.png"],
        attachments: [],
      },
    ];

    await saveChannel("channel", messages, config, null, fakeDownloadMedia);

    const saved = JSON.parse(fs.readFileSync(path.join(dir, "channel", "messages.json"), "utf8"));
    assert.equal(saved[0].localImages[0], "images/img_photo.png");
    assert.equal(saved[0].localAttachments.length, 0);
  });

  it("prints the folder, saved summary, and output lines", async () => {
    const dir = tmpDir();
    const messages = [{ msgId: "1", images: ["https://cdn.example.com/photo.png"] }];

    const { output, result } = await captureStdout(() =>
      saveChannel("channel", messages, { backupDir: dir }, null, fakeDownloadMedia)
    );

    assert.ok(output.includes(`  Folder: ${result.channelDir}\n`), output);
    assert.ok(output.includes("\n  Saved 1 message | Images: 1 | Attachments: 0\n"), output);
    assert.ok(output.includes(`  Output: ${result.channelDir}\n`), output);
  });

  it("uses the plural in the saved summary for several messages", async () => {
    const dir = tmpDir();
    const messages = [{ msgId: "1" }, { msgId: "2" }];

    const { output } = await captureStdout(() =>
      saveChannel("channel", messages, { backupDir: dir }, null, async () => {})
    );

    assert.ok(output.includes("\n  Saved 2 messages | Images: 0 | Attachments: 0\n"), output);
  });

  it("renders a progress bar and success summary during real downloads", async () => {
    const dir = tmpDir();
    const imagesDir = path.join(dir, "images");
    const attachmentsDir = path.join(dir, "attachments");
    fs.mkdirSync(imagesDir, { recursive: true });
    fs.mkdirSync(attachmentsDir, { recursive: true });

    const messages = [
      {
        images: ["https://cdn.example.com/photo.png"],
        attachments: [{ label: "doc.pdf", url: "https://cdn.example.com/doc.pdf" }],
      },
    ];

    async function fakeDownloadFile(url, dest) {
      fs.writeFileSync(dest, `data-${path.basename(dest)}`);
    }

    const chunks = [];
    const originalWrite = process.stdout.write;
    process.stdout.write = (chunk) => {
      chunks.push(chunk);
      return true;
    };

    try {
      await downloadMedia(messages, imagesDir, attachmentsDir, null, fakeDownloadFile);
    } finally {
      process.stdout.write = originalWrite;
    }

    const output = chunks.join("");
    assert.match(output, /Images.*\[.*\].*100%/);
    assert.match(output, /Attachments.*\[.*\].*100%/);
    assert.match(output, /Images done: 1 downloaded, 0 reused, 0 failed/);
    assert.match(output, /Attachments done: 1 downloaded, 0 reused, 0 failed\./);
    assert.match(output, / 1\/1 unique \| 1 downloaded 0 reused 0 failed \d+s/);
    assert.match(messages[0].localImages[0], /^images\/photo_[0-9a-f]{64}\.png$/);
    assert.match(messages[0].localAttachments[0].path, /^attachments\/doc_[0-9a-f]{64}\.pdf$/);
  });

  it("omits failed media references and saveChannel counts", async () => {
    const dir = tmpDir();
    const messages = [
      {
        images: ["https://cdn.example.com/photo.png"],
        attachments: [{ label: "report", url: "https://cdn.example.com/report.pdf" }],
      },
    ];

    async function fakeDownloadFile() {
      throw new Error("network error");
    }

    const chunks = [];
    const originalWrite = process.stdout.write;
    process.stdout.write = (chunk) => {
      chunks.push(chunk);
      return true;
    };

    let result;
    try {
      result = await saveChannel("failed-media", messages, { backupDir: dir }, null, (...args) =>
        downloadMedia(...args, fakeDownloadFile)
      );
    } finally {
      process.stdout.write = originalWrite;
    }

    const output = chunks.join("");
    assert.match(output, /\[skip img\]/);
    assert.match(output, /\[skip att\]/);
    assert.match(output, /Images done: 0 downloaded, 0 reused, 1 failed/);
    assert.match(output, /Attachments done: 0 downloaded, 0 reused, 1 failed/);
    assert.deepEqual(messages[0].localImages, []);
    assert.deepEqual(messages[0].localAttachments, []);
    assert.equal(result.imageCount, 0);
    assert.equal(result.attachmentCount, 0);
  });

  it("propagates cancellation instead of treating it as a skipped attachment", async () => {
    const dir = tmpDir();
    const imagesDir = path.join(dir, "images");
    const attachmentsDir = path.join(dir, "attachments");
    fs.mkdirSync(imagesDir, { recursive: true });
    fs.mkdirSync(attachmentsDir, { recursive: true });

    const messages = [
      {
        images: [],
        attachments: [{ label: "report", url: "https://cdn.example.com/report.pdf" }],
      },
    ];
    const cancelError = new Error("Cancelled");
    cancelError.name = "CancelError";

    await assert.rejects(
      downloadMedia(messages, imagesDir, attachmentsDir, null, async () => {
        throw cancelError;
      }),
      (error) => error === cancelError
    );
    assert.deepEqual(messages[0].localAttachments, []);
  });

  it("propagates cancellation by identity even when the message is not English", async () => {
    const dir = tmpDir();
    const imagesDir = path.join(dir, "images");
    const attachmentsDir = path.join(dir, "attachments");
    const messages = [{ images: ["https://cdn.example.com/photo.png"], attachments: [] }];
    const cancelError = new Error("Descarga cancelada");
    cancelError.name = "CancelError";

    try {
      await assert.rejects(
        downloadMedia(messages, imagesDir, attachmentsDir, null, async () => {
          throw cancelError;
        }),
        (error) => error === cancelError
      );
    } finally {
      fs.rmSync(dir, { recursive: true, force: true });
    }
  });

  it("skips a generic download error even when its message mentions cancellation", async () => {
    const dir = tmpDir();
    const imagesDir = path.join(dir, "images");
    const attachmentsDir = path.join(dir, "attachments");
    const messages = [{ images: ["https://cdn.example.com/photo.png"], attachments: [] }];

    const chunks = [];
    const originalWrite = process.stdout.write;
    process.stdout.write = (chunk) => {
      chunks.push(chunk);
      return true;
    };

    try {
      await downloadMedia(messages, imagesDir, attachmentsDir, null, async () => {
        throw new Error("Request cancelled by peer");
      });
    } finally {
      process.stdout.write = originalWrite;
      fs.rmSync(dir, { recursive: true, force: true });
    }

    assert.match(chunks.join(""), /\[skip img\]/);
    assert.deepEqual(messages[0].localImages, []);
  });
});

describe("writer output in the default language (Spanish)", () => {
  async function downloadWith(downloadFileFn) {
    const dir = tmpDir();
    const messages = [
      {
        images: ["https://cdn.example.com/photo.png"],
        attachments: [{ label: "doc.pdf", url: "https://cdn.example.com/doc.pdf" }],
      },
    ];
    try {
      const { output } = await captureStdout(() =>
        downloadMedia(
          messages,
          path.join(dir, "images"),
          path.join(dir, "attachments"),
          null,
          downloadFileFn
        )
      );
      return output;
    } finally {
      fs.rmSync(dir, { recursive: true, force: true });
    }
  }

  it("prints Spanish progress lines and per-type summaries", async () => {
    const output = await downloadWith(async (url, dest) => {
      if (url.endsWith(".pdf")) throw new Error("network error");
      fs.mkdirSync(path.dirname(dest), { recursive: true });
      fs.writeFileSync(dest, "data");
    });

    assert.match(output, /Imágenes \[.*\] 100%/);
    assert.match(output, /Adjuntos \[.*\] 100%/);
    assert.match(output, / 1\/1 archivos \| descargados: 1 reutilizados: 0 fallidos: 0 \d+s/);
    assert.match(output, / 1\/1 archivos \| descargados: 0 reutilizados: 0 fallidos: 1 \d+s/);
    assert.match(output, /Imágenes listas\. Descargados: 1, reutilizados: 0, fallidos: 0\./);
    assert.match(output, /Adjuntos listos\. Descargados: 0, reutilizados: 0, fallidos: 1\./);
    assert.doesNotMatch(output, /unique|downloaded|reused|\[skip/);
  });

  it("tags skipped images and attachments in Spanish, keeping the error text", async () => {
    const output = await downloadWith(async () => {
      throw new Error("network error");
    });

    assert.match(output, /\n {2}\[omitido img\] network error\n/);
    assert.match(output, /\n {2}\[omitido adj\] network error\n/);
  });

  it("writes index.html in Spanish", async () => {
    const dir = tmpDir();
    try {
      const messages = [{ msgId: "1", timestamp: "2024-01-01T12:00:00.000Z", text: "hola" }];
      await captureStdout(() =>
        saveChannel("visor-es", messages, { backupDir: dir }, null, async () => {})
      );
      const html = fs.readFileSync(path.join(dir, "visor-es", "index.html"), "utf8");
      assert.match(html, /<html lang="es">/);
      assert.match(html, /placeholder="Buscar en el chat…"/);
      assert.match(html, /<span class="header-meta">1 mensaje &mdash; /);
    } finally {
      fs.rmSync(dir, { recursive: true, force: true });
    }
  });

  it("prints the folder, saved summary, and output lines in Spanish", async () => {
    const dir = tmpDir();
    try {
      const { output, result } = await captureStdout(() =>
        saveChannel("canal", [{ msgId: "1" }], { backupDir: dir }, null, async () => {})
      );
      assert.ok(output.includes(`  Carpeta: ${result.channelDir}\n`), output);
      assert.ok(output.includes("\n  Se guardó 1 mensaje | Imágenes: 0 | Adjuntos: 0\n"), output);
      assert.ok(output.includes(`  Salida: ${result.channelDir}\n`), output);
    } finally {
      fs.rmSync(dir, { recursive: true, force: true });
    }
  });

  it("uses the plural in the Spanish saved summary for several messages", async () => {
    const dir = tmpDir();
    const messages = [{ msgId: "1" }, { msgId: "2" }];

    const { output } = await captureStdout(() =>
      saveChannel("canal", messages, { backupDir: dir }, null, async () => {})
    );

    assert.ok(output.includes("\n  Se guardaron 2 mensajes | Imágenes: 0 | Adjuntos: 0\n"), output);
  });

  for (const [channelName, expected] of [
    ["..", 'Nombre de canal no válido "..": se esperaba un subdirectorio de canal no vacío'],
    ["CON", 'Nombre de canal no válido "CON": es un nombre reservado en Windows'],
  ]) {
    it(`rejects ${JSON.stringify(channelName)} with a Spanish error`, async () => {
      const dir = tmpDir();
      try {
        await assert.rejects(
          saveChannel(channelName, [], { backupDir: dir }, null, async () => {}),
          (error) => error.message === expected
        );
      } finally {
        fs.rmSync(dir, { recursive: true, force: true });
      }
    });
  }
});
