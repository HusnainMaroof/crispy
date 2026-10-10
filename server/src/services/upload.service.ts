import cloudinary from "../config/cloudinary.js";
import type { UploadApiOptions } from "cloudinary";

export interface UploadResult {
  url: string;
  publicId: string;
}

/**
 * Eager transformation applied to every image on the way in. Nothing about the
 * stored original changes, this just tells Cloudinary to derive the delivered
 * file up front, so the first page view does not pay for the conversion.
 *
 * Quality 82 is the point where food photography stops showing visible
 * artefacts. `f_auto` hands the browser WebP or AVIF instead of a large JPEG,
 * and the 2000px cap is wider than any store image is ever rendered, so a phone
 * photo is never served at 4000px wide.
 */
const IMAGE_TRANSFORMATION: UploadApiOptions = {
  transformation: [
    { width: 2000, height: 2000, crop: "limit" },
    { quality: 82 },
    { fetch_format: "auto" },
  ],
};

export function uploadImage(buffer: Buffer, folder = "uploads"): Promise<UploadResult> {
  return uploadMedia(buffer, folder, "image", IMAGE_TRANSFORMATION);
}

export function uploadVideo(buffer: Buffer, folder = "uploads"): Promise<UploadResult> {
  return uploadMedia(buffer, folder, "video");
}

/** Documents (CVs) go up as `raw`, which is how Cloudinary serves non-image
 * files like PDFs and Word documents unchanged. The extension is part of the
 * public id because a raw upload keeps that id verbatim: without it the
 * "View CV" link would point at a URL no browser can preview.
 */
export function uploadDocument(buffer: Buffer, extension = "pdf", folder = "cvs"): Promise<UploadResult> {
  return uploadMedia(buffer, folder, "raw", {
    public_id: `${folder}/cv-${crypto.randomUUID()}.${extension}`,
  });
}

function uploadMedia(
  buffer: Buffer,
  folder: string,
  resourceType: "image" | "video" | "raw",
  extra: UploadApiOptions = {},
): Promise<UploadResult> {
  const options: UploadApiOptions = {
    resource_type: resourceType,
    folder,
    overwrite: false,
    unique_filename: true,
    ...extra,
  };

  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(options, (error, result) => {
      if (error) return reject(error);
      if (!result) return reject(new Error("Cloudinary returned no result"));
      resolve({ url: result.secure_url, publicId: result.public_id });
    });
    stream.end(buffer);
  });
}

export async function deleteImage(publicId: string): Promise<void> {
  await cloudinary.uploader.destroy(publicId);
}
