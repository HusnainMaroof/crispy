"use client";

import Image, { type ImageProps } from "next/image";
import { useState } from "react";

const BLUR_DATA_URL =
  "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzIwIiBoZWlnaHQ9IjMyMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjMjEyNTJhIi8+PC9zdmc+";

type OptimizedImageProps = Omit<ImageProps, "placeholder" | "blurDataURL"> & {
  blur?: boolean;
};

export default function OptimizedImage({
  blur = true,
  className = "",
  alt,
  ...props
}: OptimizedImageProps) {
  const [loaded, setLoaded] = useState(false);

  return (
    <Image
      {...props}
      alt={alt}
      placeholder={blur ? "blur" : undefined}
      blurDataURL={blur ? BLUR_DATA_URL : undefined}
      className={`transition-opacity duration-500 ${loaded ? "opacity-100" : "opacity-0"} ${className}`}
      onLoad={() => setLoaded(true)}
    />
  );
}
