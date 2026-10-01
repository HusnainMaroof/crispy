import { loadCmsPage } from "@/lib/load-cms";
import { loadStoreLocations } from "@/lib/load-locations";
import { isApiResponding } from "@/lib/api-health";
import { StoreLocationsProvider } from "@/lib/use-store-locations";
import type { NavbarContent } from "@/app/components/store/navbar";
import StoreStatus from "@/app/components/store/store-status";
import type { OrderingContent } from "@/lib/use-store-ordering";
import HomeView, { type Homepage } from "@/app/components/store/home-view";

const FALLBACK: Homepage = { order: ["hero", "welcome", "flavours", "locations", "partner", "instagram"], sections: {} };

type SitePage = { sections?: { ordering?: OrderingContent } };

const Page = async () => {
  if (!(await isApiResponding())) {
    return (
      <div className="min-h-screen bg-black text-white">
        <StoreStatus kind="offline" />
      </div>
    );
  }

  const [homeEn, homeAr, navEn, navAr, siteEn, siteAr, branches] = await Promise.all([
    loadCmsPage<Homepage>("home", "en"),
    loadCmsPage<Homepage>("home", "ar"),
    loadCmsPage<{ sections?: NavbarContent }>("navbar", "en"),
    loadCmsPage<{ sections?: NavbarContent }>("navbar", "ar"),
    loadCmsPage<SitePage>("site", "en"),
    loadCmsPage<SitePage>("site", "ar"),
    loadStoreLocations(),
  ]);
  return (
    <StoreLocationsProvider initial={branches}>
      <HomeView
        home={{ en: homeEn ?? FALLBACK, ar: homeAr ?? homeEn ?? FALLBACK }}
        navbar={{ en: navEn?.sections, ar: navAr?.sections }}
        ordering={{ en: siteEn?.sections?.ordering, ar: siteAr?.sections?.ordering }}
      />
    </StoreLocationsProvider>
  );
};

export default Page;
