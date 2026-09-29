import { loadCmsPage } from "@/lib/load-cms";
import type { NavbarContent } from "@/app/components/store/navbar";
import HomeView, { type Homepage } from "@/app/components/store/home-view";

const FALLBACK: Homepage = { order: ["hero", "welcome", "flavours", "locations", "partner", "instagram"], sections: {} };

const Page = async () => {
  const [homeEn, homeAr, navEn, navAr] = await Promise.all([
    loadCmsPage<Homepage>("home", "en"),
    loadCmsPage<Homepage>("home", "ar"),
    loadCmsPage<{ sections?: NavbarContent }>("navbar", "en"),
    loadCmsPage<{ sections?: NavbarContent }>("navbar", "ar"),
  ]);
  return (
    <HomeView
      home={{ en: homeEn ?? FALLBACK, ar: homeAr ?? homeEn ?? FALLBACK }}
      navbar={{ en: navEn?.sections, ar: navAr?.sections }}
    />
  );
};

export default Page;
