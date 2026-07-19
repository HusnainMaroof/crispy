import type { Metadata } from "next";
import { Bebas_Neue, Oswald, Plus_Jakarta_Sans, Teko } from "next/font/google";
import { Providers } from "@/components/providers";
import "./globals.css";

const bebas = Bebas_Neue({
  weight: "400",
  variable: "--font-bebas",
  display: "swap",
  subsets: ["latin"],
});

const oswald = Oswald({
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-oswald",
  display: "swap",
  subsets: ["latin"],
});

const jakarta = Plus_Jakarta_Sans({
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-jakarta",
  display: "swap",
  subsets: ["latin"],
});

const teko = Teko({
  weight: ["400", "500", "600", "700"],
  variable: "--font-teko-raw",
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
    icon: "/favicon.ico",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${bebas.variable} ${oswald.variable} ${jakarta.variable} ${teko.variable}`}>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
