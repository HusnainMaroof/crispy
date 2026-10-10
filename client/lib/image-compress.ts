/**
 * Shrinks an image in the browser before it is uploaded.
 *
 * The server and Cloudinary both compress on the way in, but that happens after
 * the whole file has crossed the network. Sending a 12 MB phone photo to
 * compress it down to 300 KB wastes the user's data and our bandwidth, so the
 * heavy lifting happens here first.
 *
 * The result is always at most as large as the input. If anything goes wrong, or
 * the re-encode does not actually help, the original file is returned untouched
 * so an upload is never blocked by an optimisation.
 */

/** JPEG-grade quality, which still looks sharp for food photography. */
const QUALITY = 0.82;

/** Matches the Cloudinary cap in the server's upload service. A larger source is
 * only ever displayed smaller than this anyway. */
const MAX_EDGE = 2000;

/** Below this there is nothing meaningful to gain, so the file is passed as is. */
const MIN_BYTES = 64 * 1024;

/** Transparent pixels survive as WebP. A JPEG would flatten them onto black. */
const OUTPUT_TYPE = "image/webp";
const OUTPUT_EXTENSION = "webp";

/** An animation loses every frame to a canvas re-encode, and an SVG is vector
 * artwork that is already as small as it is going to get. */
const PASSTHROUGH_TYPES = new Set(["image/gif", "image/svg+xml"]);

export async function compressImage(file: File): Promise<File> {
  try {
    if (PASSTHROUGH_TYPES.has(file.type)) return file;
    if (!file.type.startsWith("image/")) return file;
    if (file.size <= MIN_BYTES) return file;

    const url = URL.createObjectURL(file);
    try {
      const source = await decode(url);
      const scale = Math.min(1, MAX_EDGE / Math.max(source.width, source.height));
      const canvas = document.createElement("canvas");
      canvas.width = Math.max(1, Math.round(source.width * scale));
      canvas.height = Math.max(1, Math.round(source.height * scale));

      const context = canvas.getContext("2d");
      if (!context) return file;
      context.imageSmoothingQuality = "high";
      context.drawImage(source, 0, 0, canvas.width, canvas.height);

      const blob = await toBlob(canvas);
      // A re-encode that came out bigger, or a format the browser refused, is
      // not worth sending.
      if (!blob || blob.size >= file.size) return file;

      const stem = file.name.replace(/\.[^.]+$/, "");
      return new File([blob], `${stem}.${OUTPUT_EXTENSION}`, {
        type: OUTPUT_TYPE,
        lastModified: Date.now(),
      });
    } finally {
      // Safe once the bitmap is drawn: `drawImage` copied the pixels already.
      URL.revokeObjectURL(url);
    }
  } catch {
    // Canvas is unavailable in some contexts, and a corrupt image throws here.
    // Neither should cost the user their upload.
    return file;
  }
}

function decode(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Could not decode image"));
    img.src = url;
  });
}

function toBlob(canvas: HTMLCanvasElement): Promise<Blob | null> {
  return new Promise((resolve) => {
    canvas.toBlob(resolve, OUTPUT_TYPE, QUALITY);
  });
}