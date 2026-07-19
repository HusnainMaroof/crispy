"use client";

import { Toaster } from "react-hot-toast";
import Navbar from "@/components/store/navbar";
import Footer from "@/components/store/footer";
import SmoothScroll from "@/components/providers/smooth-scroll";
import ScrollProgressIndicator from "@/components/store/scroll-progress";
import CookieConsent from "@/components/store/cookie-consent";

export default function StoreLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SmoothScroll>
      <Toaster
        position="top-center"
        toastOptions={{
          duration: 3000,
          style: {
            background: "#1a1a1a",
            color: "#fff",
            border: "1px solid rgba(255,255,255,0.1)",
            borderRadius: "9999px",
            fontSize: "13px",
            fontWeight: 600,
            padding: "12px 20px",
          },
          success: {
            iconTheme: { primary: "#DC2626", secondary: "#fff" },
          },
        }}
      />
      <div className="min-h-screen bg-black">
        <Navbar />
        <main>{children}</main>
        <Footer />
        <CookieConsent />
        <ScrollProgressIndicator />
      </div>
    </SmoothScroll>
  );
}