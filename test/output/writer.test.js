const { describe, it } = require("node:test");
const assert = require("node:assert/strict");
const { createHash } = require("crypto");
const fs = require("fs");
const os = require("os");
const path = require("path");
const { saveChannel, downloadMedia } = require("../../src/output/writer.js");

describe("saveChannel", () => {
  function tmpDir() {
    return fs.mkdtempSync(path.join(os.tmpdir(), "writer-"));
  }

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
    assert.match(output, /Attachments done: 1 downloaded, 0 reused, 0 failed/);
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
});
