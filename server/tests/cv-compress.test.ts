import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { PDFDocument } from "pdf-lib";
import { strToU8, unzipSync, zipSync } from "fflate";
import { compressCv } from "../src/services/cv-compress.js";

const PDF_MIME = "application/pdf";
const DOCX_MIME = "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
const DOC_MIME = "application/msword";

describe("CV compression", () => {
  it("keeps a PDF loadable and never grows it", async () => {
    const doc = await PDFDocument.create();
    const page = doc.addPage([595, 842]);
    page.drawText("Curriculum vitae", { x: 50, y: 700, size: 18 });
    // Saved without object streams, so the rewrite has something to tighten.
    const original = Buffer.from(await doc.save({ useObjectStreams: false }));

    const out = await compressCv(PDF_MIME, original);
    assert.ok(out.length <= original.length, `grew from ${original.length} to ${out.length}`);
    assert.equal(out.subarray(0, 5).toString(), "%PDF-");
    const reloaded = await PDFDocument.load(out);
    assert.equal(reloaded.getPageCount(), 1);
  });

  it("keeps a DOCX intact as a zip and never grows it", async () => {
    const documentXml = `<w:document>${"cover letter line ".repeat(400)}</w:document>`;
    const original = Buffer.from(
      zipSync(
        {
          "[Content_Types].xml": strToU8("<Types/>"),
          "word/document.xml": strToU8(documentXml),
        },
        { level: 6 },
      ),
    );

    const out = await compressCv(DOCX_MIME, original);
    assert.ok(out.length <= original.length, `grew from ${original.length} to ${out.length}`);
    const entries = unzipSync(out);
    assert.deepEqual(Object.keys(entries).sort(), ["[Content_Types].xml", "word/document.xml"]);
    assert.equal(new TextDecoder().decode(entries["word/document.xml"]), documentXml);
  });

  it("stores an old-format .doc untouched", async () => {
    const original = Buffer.from([0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1]);
    const out = await compressCv(DOC_MIME, original);
    assert.equal(out, original);
  });

  it("falls back to the original when a file cannot be rewritten", async () => {
    // Not a real PDF and not a real zip: both rewrites throw, and the upload
    // must still go through with the bytes the applicant sent.
    for (const mimetype of [PDF_MIME, DOCX_MIME]) {
      const original = Buffer.from("broken");
      const out = await compressCv(mimetype, original);
      assert.equal(out, original);
    }
  });
});
