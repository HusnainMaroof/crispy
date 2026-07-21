import type { Request, Response } from "express";
import { sendSuccess } from "../../utils/response.js";
import { BadRequestException, InternalServerException } from "../../utils/app-error.js";
import { uploadImage } from "../../services/upload.service.js";
import { logger } from "../../middleware/logger.js";

export const UploadController = {
  async upload(req: Request, res: Response) {
    const file = req.file;
    if (!file) throw new BadRequestException("No file provided");

    try {
      const { url, publicId } = await uploadImage(file.buffer, "menu");
      sendSuccess(res, { url, publicId }, 201);
    } catch (err: unknown) {
      logger.error({ err }, "Cloudinary upload failed");
      const msg = err instanceof Error ? err.message : "Upload failed";
      throw new InternalServerException(`Image upload failed: ${msg}`);
    }
  },
};
