import type { Metadata } from "next";
import localFont from "next/font/local";
import { Plus_Jakarta_Sans, Inter, Poppins } from "next/font/google";
import { Providers } from "@/app/components/providers";
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
  metadataBase: new URL("https://crispies.co.uk"),
  title: {
    default: "Crispies — Halal Burgers & Chicken in London",
    template: "%s | Crispies",
  },
  description:
    "Crispies serves 100% halal smash burgers and crispy chicken across London. Order delivery or click & collect — crispy on the outside, juicy on the inside.",
  keywords: [
    "halal burgers London",
    "chicken London",
    "smash burger",
    "fast food London",
    "Crispies",
    "delivery",
    "click and collect",
  ],
  applicationName: "Crispies",
  authors: [{ name: "Crispies" }],
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
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    siteName: "Crispies",
    title: "Crispies — Halal Burgers & Chicken in London",
    description:
      "100% halal smash burgers and crispy chicken, delivered across London. Order delivery or click & collect.",
    url: "https://crispies.co.uk",
    locale: "en_GB",
  },
  twitter: {
    card: "summary_large_image",
    title: "Crispies — Halal Burgers & Chicken in London",
    description:
      "100% halal smash burgers and crispy chicken, delivered across London.",
  },
  icons: {
    icon: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${korolev.variable} ${jakarta.variable} ${inter.variable} ${poppins.variable}`}>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
