import type { Request, Response } from "express";
import { uploadImage } from "../../services/upload.service.js";
import { sendSuccess } from "../../utils/response.js";
import { BadRequestException, InternalServerException } from "../../utils/app-error.js";

export const UploadController = {
  async upload(req: Request, res: Response) {
    const file = req.file;
    if (!file) throw new BadRequestException("No file provided");

    const allowedMimes = ["image/jpeg", "image/png", "image/webp", "image/avif"];
    if (!allowedMimes.includes(file.mimetype)) {
      throw new BadRequestException("Invalid file type — allowed: JPEG, PNG, WebP, AVIF");
    }

    try {
      const url = await uploadImage(file.buffer, { folder: "crispies" });
      sendSuccess(res, { url }, 201);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Upload failed";
      throw new InternalServerException(
        msg.includes("permissions")
          ? "Cloudinary API key is read-only. Go to https://console.cloudinary.com — Settings → API Keys — and create a key with Upload enabled, or re-enable Upload on the existing key."
          : msg.includes("403")
            ? "Cloudinary credentials invalid. Check CLOUDINARY_API_KEY and CLOUDINARY_API_SECRET in your .env."
            : `Image upload failed: ${msg}`,
      );
    }
  },
};
