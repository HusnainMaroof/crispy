import { v2 as cloudinary } from "cloudinary";
import { envConfig } from "../config/env.js";

cloudinary.config({
  cloud_name: envConfig.CLOUDINARY.CLOUD_NAME,
  api_key: envConfig.CLOUDINARY.API_KEY,
  api_secret: envConfig.CLOUDINARY.API_SECRET,
});

interface UploadOptions {
  folder?: string;
  public_id?: string;
}

export async function uploadImage(
  buffer: Buffer,
  options: UploadOptions = {},
): Promise<string> {
  const b64 = buffer.toString("base64");
  const result = await cloudinary.uploader.upload(
    `data:image/png;base64,${b64}`,
    { folder: options.folder ?? "crispies", public_id: options.public_id },
  );
  return result.secure_url;
}

export async function deleteImage(publicId: string): Promise<void> {
  await cloudinary.uploader.destroy(publicId);
}

export function getPublicIdFromUrl(url: string): string | null {
  const match = url.match(/\/v\d+\/(.+)\.\w+$/);
  return match ? match[1] : null;
}
