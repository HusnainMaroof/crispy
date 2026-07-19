import type { NextConfig } from "next";

const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL ?? "";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "www.zycocudi.us" },
    ],
  },
  async headers() {
    const connectSrc = ["'self'", apiBase].filter(Boolean).join(" ");
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "Content-Security-Policy",
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-eval' 'unsafe-inline'",
              "style-src 'self' 'unsafe-inline'",
              "img-src 'self' https://images.unsplash.com https://www.zycocudi.us",
              "media-src 'self'",
              "font-src 'self'",
              `connect-src ${connectSrc}`,
              "frame-src 'none'",
              "object-src 'none'",
            ].join("; "),
          },
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
