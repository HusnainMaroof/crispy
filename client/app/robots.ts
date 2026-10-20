import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";

// Staff panels and the API. Checkout and orders stay crawlable on purpose, so
// crawlers can read their noindex tag and drop them from the index.
const PRIVATE = ["/super-admin", "/admin", "/login", "/api/"];

// Search engines, plus the crawlers behind AI search answers, named one by one
// so each gets the same clear rules.
const CRAWLERS = [
  "Googlebot",
  "Googlebot-Image",
  "Bingbot",
  "DuckDuckBot",
  "Applebot",
  "YandexBot",
  "OAI-SearchBot",
  "ChatGPT-User",
  "GPTBot",
  "ClaudeBot",
  "PerplexityBot",
];

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      { userAgent: CRAWLERS, allow: "/", disallow: PRIVATE },
      { userAgent: "*", allow: "/", disallow: PRIVATE },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
