const { describe, it } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("fs");
const os = require("os");
const path = require("path");
const { saveChannel, downloadMedia } = require("../../src/output/writer.js");

describe("saveChannel", () => {
  function tmpDir() {
    return fs.mkdtempSync(path.join(os.tmpdir(), "writer-"));
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

  it("reuses existing image files and marks them in localImages", async () => {
    const dir = tmpDir();
    const channelDir = path.join(dir, "channel");
    const imagesDir = path.join(channelDir, "images");
    fs.mkdirSync(imagesDir, { recursive: true });
    fs.writeFileSync(path.join(imagesDir, "img_photo.png"), "existing");

    const config = { backupDir: dir };
    const messages = [
      {
        msgId: "1",
        timestamp: "2024-01-01T12:00:00.000Z",
        text: "",
        images: ["https://cdn.example.com/photo.png"],
      },
    ];

    let downloaded = false;
    // eslint-disable-next-line no-unused-vars
    function fakeWithCheck(msgs, imgDir, _attDir, _cancel) {
      for (const m of msgs) {
        m.localImages = [];
        for (const imgUrl of m.images || []) {
          const fname = `img_${path.basename(imgUrl)}`;
          const dest = path.join(imgDir, fname);
          if (!fs.existsSync(dest)) {
            downloaded = true;
            fs.writeFileSync(dest, "image-data");
          }
          m.localImages.push(path.posix.join("images", fname));
        }
        m.localAttachments = [];
      }
    }

    await saveChannel("channel", messages, config, null, fakeWithCheck);

    assert.equal(downloaded, false);
    assert.equal(fs.readFileSync(path.join(imagesDir, "img_photo.png"), "utf8"), "existing");
    assert.deepEqual(messages[0].localImages, ["images/img_photo.png"]);
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
    assert.match(output, /Images done:.*saved/);
    assert.match(output, /Attachments done:.*saved/);
    assert.equal(messages[0].localImages[0], "images/photo.png");
    assert.equal(messages[0].localAttachments[0].path, "attachments/doc.pdf");
  });

  it("counts skipped files when the download fails", async () => {
    const dir = tmpDir();
    const imagesDir = path.join(dir, "images");
    const attachmentsDir = path.join(dir, "attachments");
    fs.mkdirSync(imagesDir, { recursive: true });
    fs.mkdirSync(attachmentsDir, { recursive: true });

    const messages = [
      {
        images: ["https://cdn.example.com/photo.png"],
        attachments: [],
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

    try {
      await downloadMedia(messages, imagesDir, attachmentsDir, null, fakeDownloadFile);
    } finally {
      process.stdout.write = originalWrite;
    }

    const output = chunks.join("");
    assert.match(output, /\[skip img\]/);
    assert.match(output, /Images done: 0 saved, 1 failed/);
    assert.equal(messages[0].localImages.length, 1);
  });
});
