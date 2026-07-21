"use client";

import Image, { type ImageProps } from "next/image";
import { useState } from "react";

/**
 * Shared SVG blur placeholder. Next.js requires `blurDataURL` to be a data
 * URL (or a static import) for remote images — using a single dark grey
 * rectangle gives a smooth fade-from-grey without per-image round-trips.
 */
const FALLBACK_BLUR_DATA_URL =
  "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzIwIiBoZWlnaHQ9IjMyMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjMjEyNTJhIi8+PC9zdmc+";

/**
 * Build a tiny blurred Cloudinary URL — useful when you want a lightweight
 * blurred thumbnail for previews, gallery mockups, etc. Cloudinary supports
 * in-URL image transforms so this adds `c_scale,w_24,q_20,e_blur:800` and
 * returns a completely new URL on the same public ID.
 */
export function buildCloudinaryBlurUrl(src: string): string | null {
  if (typeof src !== "string") return null;
  if (!src.includes("res.cloudinary.com/") && !src.includes(".cloudinary.com/")) {
    return null;
  }
  if (!src.includes("/image/upload/")) return null;
  return src.replace(
    "/image/upload/",
    "/image/upload/c_scale,w_24,q_20,e_blur:800/",
  );
}

const ALLOWED_HOSTS = [
  "images.unsplash.com",
  "res.cloudinary.com",
  "www.zycocudi.us",
];

function hostAllowed(src: string): boolean {
  try {
    const host = new URL(src).hostname;
    return ALLOWED_HOSTS.some((h) => host === h || host.endsWith("." + h));
  } catch {
    return false;
  }
}

type OptimizedImageProps = Omit<ImageProps, "placeholder" | "blurDataURL"> & {
  blur?: boolean;
};

export default function OptimizedImage({
  blur = true,
  className = "",
  alt,
  src,
  priority,
  ...props
}: OptimizedImageProps) {
  const [loaded, setLoaded] = useState(false);
  const [errored, setErrored] = useState(false);

  if (errored || (typeof src === "string" && src && !hostAllowed(src))) {
    return (
      <img
        src={src as string}
        alt={alt}
        className={`transition-opacity duration-500 opacity-100 ${className}`}
      />
    );
  }

  return (
    <Image
      {...props}
      src={src}
      alt={alt}
      priority={priority}
      loading={priority ? undefined : "lazy"}
      placeholder={blur ? "blur" : undefined}
      blurDataURL={blur ? FALLBACK_BLUR_DATA_URL : undefined}
      quality={props.quality ?? 78}
      className={`transition-opacity duration-500 ${
        loaded ? "opacity-100" : "opacity-0"
      } ${className}`}
      onLoad={() => setLoaded(true)}
      onError={() => setErrored(true)}
    />
  );
}

export { FALLBACK_BLUR_DATA_URL };