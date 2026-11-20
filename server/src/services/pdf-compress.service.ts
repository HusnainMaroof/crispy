import { PDFDocument } from "pdf-lib";
import { logger } from "../middleware/logger.js";

export type CompressedPdf = { buffer: Buffer; before: number; after: number };

/**
 * Rewrites a PDF with compressed object streams and without its editing
 * metadata. This is lossless, so pages and images look exactly the same.
 * The smaller of the original and the rewrite is kept, and any PDF that cannot
 * be rewritten (encrypted or damaged) is used as it is.
 */
export async function compressPdf(input: Buffer): Promise<CompressedPdf> {
  try {
    const doc = await PDFDocument.load(input, { updateMetadata: false });
    doc.setProducer("Crispies");
    doc.setCreator("Crispies");
    doc.setKeywords([]);
    const output = Buffer.from(await doc.save({ useObjectStreams: true, addDefaultPage: false }));
    if (output.length < input.length) return { buffer: output, before: input.length, after: output.length };
  } catch (err) {
    logger.warn({ err }, "PDF could not be compressed, uploading the original");
  }
  return { buffer: input, before: input.length, after: input.length };
}
