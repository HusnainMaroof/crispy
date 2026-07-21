import cloudinary from "../config/cloudinary.js";
import type { UploadApiOptions } from "cloudinary";

export interface UploadResult {
  url: string;
  publicId: string;
}

export function uploadImage(buffer: Buffer, folder = "uploads"): Promise<UploadResult> {
  const options: UploadApiOptions = {
    resource_type: "image",
    folder,
    overwrite: false,
    unique_filename: true,
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
