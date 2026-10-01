import { Toaster } from "react-hot-toast";
import SmoothScroll from "@/app/components/providers/smooth-scroll";
import Navbar, { type NavbarContent } from "@/app/components/store/navbar";
import StoreStatus from "@/app/components/store/store-status";
import { isApiResponding } from "@/lib/api-health";
import { loadCmsPage } from "@/lib/load-cms";
import { loadStoreLocations } from "@/lib/load-locations";
import { StoreLocationsProvider } from "@/lib/use-store-locations";
import type { OrderingContent } from "@/lib/use-store-ordering";

type SitePage = { sections?: { ordering?: OrderingContent } };

export default async function StoreLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const online = await isApiResponding();
  const [english, arabic, siteEn, siteAr, branches] = online
    ? await Promise.all([
        loadCmsPage<{ sections?: NavbarContent }>("navbar", "en"),
        loadCmsPage<{ sections?: NavbarContent }>("navbar", "ar"),
        loadCmsPage<SitePage>("site", "en"),
        loadCmsPage<SitePage>("site", "ar"),
        loadStoreLocations(),
      ])
    : [null, null, null, null, []];
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
        <Navbar copies={{ en: english?.sections, ar: arabic?.sections }} ordering={{ en: siteEn?.sections?.ordering, ar: siteAr?.sections?.ordering }} />
        <main>
          <StoreLocationsProvider initial={branches}>
            {online ? children : <StoreStatus kind="offline" />}
          </StoreLocationsProvider>
        </main>
      </div>
    </SmoothScroll>
  );
}