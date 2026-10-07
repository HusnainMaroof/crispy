import { PDFDocument } from "pdf-lib";
import { unzipSync, zipSync } from "fflate";

/**
 * Lossless size reduction for uploaded CVs, run in the multer upload path
 * before the file goes to storage. Multer itself only moves multipart data, so
 * the work happens on the buffer it produced.
 *
 * Both document types are already compressed containers, so this only rewrites
 * them more tightly (PDF object streams, maximum-deflate zip entries) and never
 * changes content. The smaller of the two buffers wins: a file that is already
 * optimal is stored untouched, and a rewrite that comes out bigger is dropped.
 *
 * Nothing here is allowed to fail an upload. An encrypted or malformed PDF is
 * stored as it arrived, because rejecting the CV would cost the applicant their
 * application over a cosmetic saving.
 */

/** An old-format .doc is not a container, and a zip bomb must not be unpacked. */
const MAX_DOCX_UNCOMPRESSED = 50 * 1024 * 1024;

const PDF_MIME = "application/pdf";
const DOCX_MIME = "application/vnd.openxmlformats-officedocument.wordprocessingml.document";

export async function compressCv(mimetype: string, buffer: Buffer): Promise<Buffer> {
  try {
    if (mimetype === PDF_MIME) return smaller(buffer, await shrinkPdf(buffer));
    if (mimetype === DOCX_MIME) return smaller(buffer, shrinkDocx(buffer));
  } catch {
    // Compression is best effort only, see above.
  }
  return buffer;
}

function smaller(original: Buffer, candidate: Uint8Array): Buffer {
  return candidate.length < original.length ? Buffer.from(candidate) : original;
}

/**
 * Re-saves the PDF with its cross-reference table folded into compressed
 * object streams. An encrypted PDF throws here on purpose: loading with
 * `ignoreEncryption` would strip the protection from someone's CV.
 */
async function shrinkPdf(buffer: Buffer): Promise<Uint8Array> {
  const doc = await PDFDocument.load(buffer);
  return doc.save({ useObjectStreams: true });
}

/**
 * A .docx is a zip. Re-deflating its entries at maximum level is lossless and
 * often trims a little. The unpacked size is capped as the archive is read, so
 * a tiny zip bomb cannot expand into gigabytes of memory.
 */
function shrinkDocx(buffer: Buffer): Uint8Array {
  let unpacked = 0;
  const entries = unzipSync(buffer, {
    filter: (file) => {
      unpacked += file.originalSize;
      if (unpacked > MAX_DOCX_UNCOMPRESSED) {
        throw new Error("DOCX expands past the unpack limit");
      }
      return true;
    },
  });
  return zipSync(entries, { level: 9 });
}
