import { Toaster } from "react-hot-toast";
import SmoothScroll from "@/app/components/providers/smooth-scroll";
import Navbar, { type NavbarContent } from "@/app/components/store/navbar";
import { loadCmsPage } from "@/lib/load-cms";

export default async function StoreLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [english, arabic] = await Promise.all([
    loadCmsPage<{ sections?: NavbarContent }>("navbar", "en"),
    loadCmsPage<{ sections?: NavbarContent }>("navbar", "ar"),
  ]);
  return (
    <SmoothScroll>
      <Toaster
        position="top-center"
        toastOptions={{
          duration: 3000,
          style: {
            background: "#000000cc",
            color: "#ffffff",
            border: "1px solid rgba(255,255,255,0.1)",
            borderRadius: "9999px",
            fontSize: "13px",
            fontWeight: 600,
            padding: "12px 20px",
          },
          success: {
            iconTheme: { primary: "#FF0931", secondary: "#ffffff" },
          },
          error: {
            iconTheme: { primary: "#FF0931", secondary: "#ffffff" },
          },
        }}
      />
      <div className="min-h-screen bg-brand-black text-white selection:bg-brand-red selection:text-white">
        <Navbar copies={{ en: english?.sections, ar: arabic?.sections }} />
        <main>{children}</main>
      </div>
    </SmoothScroll>
  );
}