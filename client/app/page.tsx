import { cookies } from "next/headers";
import { resolveLocale } from "@/lib/i18n";
import { loadCmsPage } from "@/lib/load-cms";
import Navbar, { type NavbarContent } from "@/app/components/store/navbar";
import Hero from "@/app/components/store/hero";
import Welcome from "@/app/components/store/welcome";
import Flavours from "@/app/components/store/flavours";
import Locations from "@/app/components/store/locations";
import Instagram from "@/app/components/store/instagram";
import Partner from "@/app/components/store/partner";
import Footer from "@/app/components/store/footer";

type Tile = { label?: string; image?: string };
type HomeSections = {
  hero?: { lines?: string[]; videoUrl?: string };
  welcome?: { description?: string };
  flavours?: { title?: string; discoverTitle?: string; flavours?: Tile[]; scaleTitle?: string; scale?: Tile[]; galleryImages?: string[]; ctaLabel?: string; ctaUrl?: string };
  partner?: { title?: string; description?: string; ctaLabel?: string; ctaUrl?: string; imageUrl?: string };
  instagram?: { title?: string; username?: string; profileUrl?: string; posts?: string; followers?: string; following?: string; bio?: string; followLabel?: string; reels?: { url: string; thumbnailUrl: string; likes?: string; views?: string }[] };
  locations?: { title?: string; displayMode?: "cards" | "redirect"; ctaLabel?: string; ctaUrl?: string; cardLimit?: number };
};
type Homepage = { order: (keyof HomeSections)[]; sections: HomeSections };

const FALLBACK: Homepage = { order: ["hero", "welcome", "flavours", "locations", "partner", "instagram"], sections: {} };

async function loadHomepage(): Promise<Homepage> {
  try {
    const jar = await cookies();
    const locale = resolveLocale(jar.get("crispy_locale")?.value);
    const base = process.env.NEXT_PUBLIC_API_BASE_URL ?? "";
    const res = await fetch(`${base}/api/store/cms/home?locale=${locale}`, { cache: "no-store" });
    if (!res.ok) return FALLBACK;
    const body = await res.json() as { data?: Homepage };
    return body.data ?? FALLBACK;
  } catch {
    return FALLBACK;
  }
}

function renderSection(key: keyof HomeSections, sections: HomeSections) {
  switch (key) {
    case "flavours": {
      const flavours = sections.flavours;
      return <Flavours key={key} title={flavours?.title} discoverTitle={flavours?.discoverTitle} flavourLabels={flavours?.flavours?.map((item) => item.label ?? "")} flavourTileImages={flavours?.flavours?.map((item) => item.image ?? "")} scaleTitle={flavours?.scaleTitle} scaleLabels={flavours?.scale?.map((item) => item.label ?? "")} scaleImages={flavours?.scale?.map((item) => item.image ?? "")} galleryImages={flavours?.galleryImages} ctaLabel={flavours?.ctaLabel} ctaUrl={flavours?.ctaUrl} />;
    }
    case "locations": {
      const locations = sections.locations;
      return <Locations key={key} title={locations?.title} displayMode={locations?.displayMode} ctaLabel={locations?.ctaLabel} ctaUrl={locations?.ctaUrl} cardLimit={locations?.cardLimit} />;
    }
    case "partner": {
      const partner = sections.partner;
      return <Partner key={key} title={partner?.title} description={partner?.description} ctaLabel={partner?.ctaLabel} imageUrl={partner?.imageUrl || undefined} ctaUrl={partner?.ctaUrl} />;
    }
    case "instagram":
      return <Instagram key={key} content={sections.instagram} followLabel={sections.instagram?.followLabel} />;
    default:
      return null;
  }
}

const Page = async () => {
  const [{ order, sections }, navbar] = await Promise.all([
    loadHomepage(),
    loadCmsPage<{ sections?: NavbarContent }>("navbar"),
  ]);
  return (
    <div>
      {/* <div className="h-screen w-screen bg-white flex items-center justify-center">
        <div className="flex flex-col gap-10">
          {" "}
          <h3 className="text-black text-2xl font-semibold pl-3.5 border-l-3 border-red-500">
            This Deployment{" "}
            <span className="text-xl text-gray-800">
              is Failed due to over storage.
            </span>
          </h3>
          <h3 className="text-black text-2xl font-semibold pl-3.5 border-l-3 border-green-500">
            Your connection{" "}
            <span className="text-xl text-gray-800">is working correctly</span>
          </h3>
          <h3 className="text-black text-2xl font-semibold pl-3.5 border-l-3 border-green-500">
            Vercel{" "}
            <span className="text-xl text-gray-800">is working correctly.</span>
          </h3>
          <div className="border-[2px] border-gray-600 rounded-[5px]  p-5 flex-col items-center justify-center">
            <h3 className="text-black text-2xl font-semibold ">
              503
              <span className="text-xl text-gray-800">
                : SERVICE_UNAVAILABLE
              </span>
            </h3>
            <h3 className="text-black text-2xl font-semibold ">
              Code
              <span className="text-xl text-gray-800">: DEPLOYMENT_FAILED</span>
            </h3>
            <h3 className="text-black text-2xl font-semibold ">
              ID
              <span className="text-xl text-gray-800">
                : sin1::wqcnm-1789489241339-94fbb6045e93
              </span>
            </h3>
          </div>
          <span className="text-xl text-gray-800">
            If you are a visitor, contact the website owner or try again later.
          </span>
        </div>
      </div> */}

      <Navbar content={navbar?.sections} />
      <div className="relative">
        {order.includes("hero") && <Hero lines={sections.hero?.lines} videoUrl={sections.hero?.videoUrl} />}
        {order.includes("welcome") && <Welcome description={sections.welcome?.description} />}
      </div>
      {order.map((key) => renderSection(key, sections))}
      <Footer />
    </div>
  );
};

export default Page;
