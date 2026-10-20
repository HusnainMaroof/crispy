import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import { Plus_Jakarta_Sans, Inter, Poppins } from "next/font/google";
import { cookies } from "next/headers";
import { Providers } from "@/app/components/providers";
import { localeDir, resolveLocale } from "@/lib/i18n";
import { DEFAULT_DESCRIPTION, DEFAULT_TITLE, SITE_NAME, SITE_URL } from "@/lib/site";
import "./globals.css";

const korolev = localFont({
  src: [
    { path: "../public/fonts/Korolev Thin Compressed.otf", weight: "100" },
    { path: "../public/fonts/Korolev Light Compressed.otf", weight: "300" },
    { path: "../public/fonts/Korolev Medium Compressed.otf", weight: "500" },
    { path: "../public/fonts/Korolev Bold Compressed.otf", weight: "700" },
    { path: "../public/fonts/Korolev Heavy Compressed.otf", weight: "900" },
  ],
  variable: "--font-korolev",
  display: "swap",
});

const jakarta = Plus_Jakarta_Sans({
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-jakarta",
  display: "swap",
  subsets: ["latin"],
});

const inter = Inter({
  weight: ["400", "500", "600", "700"],
  variable: "--font-inter",
  display: "swap",
  subsets: ["latin"],
});

const poppins = Poppins({
  weight: ["400", "700"],
  variable: "--font-poppins",
  display: "swap",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: DEFAULT_TITLE,
    template: `%s | ${SITE_NAME}`,
  },
  description: DEFAULT_DESCRIPTION,
  keywords: [
    "halal burgers",
    "halal burgers London",
    "halal chicken London",
    "fried chicken London",
    "smash burgers",
    "burger delivery London",
    "halal food near me",
    "click and collect",
    "Crispies",
  ],
  applicationName: SITE_NAME,
  authors: [{ name: SITE_NAME }],
  creator: SITE_NAME,
  publisher: SITE_NAME,
  category: "restaurant",
  formatDetection: { telephone: true, address: true, email: true },
  // Search Console and Bing Webmaster ownership codes. Set them in the client
  // env; an empty value renders no tag.
  verification: {
    google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION || undefined,
    other: process.env.NEXT_PUBLIC_BING_SITE_VERIFICATION
      ? { "msvalidate.01": process.env.NEXT_PUBLIC_BING_SITE_VERIFICATION }
      : undefined,
  },
  other: {
    "geo.region": "GB-LND",
    "geo.placename": "London",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
  // No canonical here on purpose: a canonical in the root layout is inherited by
  // every page and tells Google they are all copies of the homepage. Each page
  // sets its own through pageMetadata() in lib/site.ts.
  openGraph: {
    type: "website",
    siteName: SITE_NAME,
    locale: "en_GB",
    title: DEFAULT_TITLE,
    description: DEFAULT_DESCRIPTION,
    images: [{ url: "/images/og-logo.png", width: 1200, height: 630, alt: SITE_NAME }],
  },
  twitter: {
    card: "summary_large_image",
    title: DEFAULT_TITLE,
    description: DEFAULT_DESCRIPTION,
    images: ["/images/og-logo.png"],
  },
  // Icons come from app/favicon.ico, app/icon.png, app/apple-icon.png and
  // app/manifest.ts. Rebuild them with: node scripts/generate-icons.mjs
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#000000",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const jar = await cookies();
  const locale = resolveLocale(jar.get("crispy_locale")?.value);
  return (
    <html lang={locale} dir={localeDir(locale)} className={`${korolev.variable} ${jakarta.variable} ${inter.variable} ${poppins.variable}`}>
      <body>
        <Providers locale={locale}>{children}</Providers>
      </body>
    </html>
  );
}
