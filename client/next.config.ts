import type { NextConfig } from "next";

const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL ?? "";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "res.cloudinary.com" },
      { protocol: "https", hostname: "**.cloudinary.com" },
      { protocol: "https", hostname: "www.zycocudi.us" },
    ],
    formats: ["image/avif", "image/webp"],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    minimumCacheTTL: 60 * 60 * 24 * 30, // 30 days
    dangerouslyAllowSVG: false,
  },
  async headers() {
    const connectSrc = [
      "'self'",
      apiBase,
      "https://www.instagram.com",
      "https://www.tiktok.com",
    ]
      .filter(Boolean)
      .join(" ");
    const csp = [
      "default-src 'self'",
      "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://www.instagram.com https://www.tiktok.com",
      "script-src-elem 'self' 'unsafe-inline' https://www.instagram.com https://www.tiktok.com",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: blob: https://*.instagram.com https://*.cdninstagram.com https://*.tiktok.com https://images.unsplash.com https://res.cloudinary.com https://*.cloudinary.com https://www.zycocudi.us https://*.basemaps.cartocdn.com https://basemaps.cartocdn.com",
      "media-src 'self' blob: https://*.tiktokcdn.com https://vid.cdn-website.com",
      "font-src 'self' data:",
      `connect-src ${connectSrc}`,
      "frame-src 'self' https://www.instagram.com https://www.tiktok.com",
      "object-src 'none'",
    ].join("; ");
    return [
      {
        source: "/(.*)",
        headers: [{ key: "Content-Security-Policy", value: csp }],
      },
      {
        // Long-term browser cache for the next/image optimizer output.
        // Next.js already emits immutable cache in prod; this is a stable
        // backstop for intermediate CDNs/proxies.
        source: "/_next/image(.*)",
        headers: [
          { key: "Cache-Control", value: "public, max-age=2592000, immutable" },
        ],
      },
    ];
  },
  async rewrites() {
    const target = apiBase || "http://localhost:3001";
    return [
      {
        source: "/api/:path*",
        destination: `${target}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;
