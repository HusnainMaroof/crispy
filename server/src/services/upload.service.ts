import cloudinary from "../config/cloudinary.js";
import { envConfig } from "../config/env.js";
import { logger } from "../middleware/logger.js";
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

/**
 * Recovers the public id from a Cloudinary secure URL.
 *
 * The catalogue stores only the URL, but `destroy` needs the public id, so a
 * delete has to recover it. Shape is
 * `https://res.cloudinary.com/<cloud>/image/upload/v<version>/<public id>`.
 * The `v<version>` segment is part of the URL and not part of the public id,
 * which is why it is dropped rather than kept.
 *
 * Returns null for anything that is not an image on this project's own cloud:
 * a local placeholder, an asset hosted elsewhere, or a layout this cannot read
 * with confidence. A destructive call has to fail closed, so an unrecognised
 * URL is left alone rather than guessed at.
 */
export function publicIdFromUrl(url: string): string | null {
  if (!url) return null;

  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return null;
  }
  if (parsed.hostname !== "res.cloudinary.com") return null;

  const segments = parsed.pathname.split("/").filter(Boolean);
  if (segments.length < 5) return null;
  // Guards against destroying assets that belong to another cloud. The seed
  // points at Cloudinary's shared `demo` cloud, which is not ours to delete.
  if (segments[0] !== envConfig.CLOUDINARY.CLOUD_NAME) return null;
  // Only images. A video or raw asset needs a different resource_type on
  // destroy, and `destroy` here always defaults to image.
  if (segments[1] !== "image") return null;
  if (segments[2] !== "upload") return null;
  if (!/^v\d+$/.test(segments[3])) return null;

  const filename = segments[segments.length - 1];
  const dot = filename.lastIndexOf(".");
  if (dot <= 0) return null;

  return segments.slice(4).join("/").replace(/\.[^.]+$/, "");
}

/**
 * Best-effort cleanup for a deleted row's image.
 *
 * A Cloudinary outage must never stop the record being deleted, so failures
 * are logged and swallowed. The asset is then left orphaned in the bucket,
 * which is recoverable, whereas a failed delete that also failed to remove the
 * row would not be.
 */
export async function destroyCloudinaryAsset(url: string): Promise<void> {
  const publicId = publicIdFromUrl(url);
  if (!publicId) return;
  try {
    await deleteImage(publicId);
  } catch (error) {
    logger.error({ err: error, publicId }, "Failed to delete Cloudinary asset");
  }
}
