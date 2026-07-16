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
  title: "Crispies — Good Mood Food",
  description: "Burgers + Chicken. Fresh, fast, and crispy.",
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
