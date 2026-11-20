import type { Request, Response } from "express";
import { sendSuccess } from "../../utils/response.js";
import { BadRequestException, InternalServerException } from "../../utils/app-error.js";
import { signedDocumentUrl, uploadDocument, uploadImage, uploadVideo } from "../../services/upload.service.js";
import { logger } from "../../middleware/logger.js";
import { compressPdf } from "../../services/pdf-compress.service.js";

/** Cloudinary free-plan cap for raw files. */
const MAX_STORED_PDF_BYTES = 10 * 1024 * 1024;

export const UploadController = {
  async upload(req: Request, res: Response) {
    const file = req.file;
    if (!file) throw new BadRequestException("No file provided");

    try {
      const isVideo = file.mimetype.startsWith("video/");
      const { url, publicId } = isVideo
        ? await uploadVideo(file.buffer, "homepage")
        : await uploadImage(file.buffer, "homepage");
      sendSuccess(res, { url, publicId }, 201);
    } catch (err: unknown) {
      logger.error({ err }, "Cloudinary upload failed");
      // The provider's message can name internal buckets and credentials
      // metadata, so it is logged rather than returned.
      throw new InternalServerException("Media upload failed. Please try again.");
    }
  },

  /** A short signed link so the admin can open an uploaded PDF. */
  async openDocument(req: Request, res: Response) {
    const url = typeof req.body?.url === "string" ? req.body.url : "";
    const signed = signedDocumentUrl(url, 10 * 60);
    if (!url || signed === url) throw new BadRequestException("That is not an uploaded document");
    sendSuccess(res, { url: signed });
  },

  /** PDF brochures, compressed before upload. The bytes must start with %PDF, not just claim the type. */
  async uploadDocument(req: Request, res: Response) {
    const file = req.file;
    if (!file) throw new BadRequestException("Choose a PDF file up to 25 MB");
    if (file.buffer.subarray(0, 5).toString("latin1") !== "%PDF-") throw new BadRequestException("That file is not a valid PDF");

    const pdf = await compressPdf(file.buffer);
    if (pdf.after > MAX_STORED_PDF_BYTES) {
      throw new BadRequestException("This PDF is still over 10 MB after compression. Export it with smaller images and try again.");
    }

    try {
      const { url, publicId } = await uploadDocument(pdf.buffer, "pdf", "brochures", "brochure");
      sendSuccess(res, { url, publicId, name: file.originalname, before: pdf.before, after: pdf.after }, 201);
    } catch (err: unknown) {
      logger.error({ err }, "Cloudinary document upload failed");
      throw new InternalServerException("PDF upload failed. Please try again.");
    }
  },
};
