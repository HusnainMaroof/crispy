"use client";

import { useLocale } from "@/lib/i18n/locale-context";
import type { AppLocale } from "@/lib/i18n";
import Navbar, { type NavbarContent } from "@/app/components/store/navbar";
import Hero from "@/app/components/store/hero";
import Welcome from "@/app/components/store/welcome";
import Flavours from "@/app/components/store/flavours";
import Locations from "@/app/components/store/locations";
import Instagram from "@/app/components/store/instagram";
import Partner from "@/app/components/store/partner";
import Footer from "@/app/components/store/footer";

type Tile = { label?: string; image?: string };
export type HomeSections = {
  hero?: { lines?: string[]; videoUrl?: string };
  welcome?: { headline?: string; accent?: string; description?: string; backImage?: string; frontImage?: string };
  flavours?: { title?: string; discoverTitle?: string; tiles?: Tile[]; scaleTitle?: string; scale?: Tile[]; galleryImages?: string[]; centerImage?: string; ctaLabel?: string; ctaUrl?: string };
  partner?: { title?: string; description?: string; ctaLabel?: string; ctaUrl?: string; imageUrl?: string };
  instagram?: { title?: string; username?: string; profileUrl?: string; posts?: string; followers?: string; following?: string; bio?: string; followLabel?: string; reels?: { url: string; thumbnailUrl: string; likes?: string; views?: string }[] };
  locations?: { title?: string; ctaLabel?: string; ctaUrl?: string; locationIds?: string[] };
};
export type Homepage = { order: (keyof HomeSections)[]; sections: HomeSections };
type Copies<T> = Partial<Record<AppLocale, T>>;

function renderSection(key: keyof HomeSections, sections: HomeSections) {
  switch (key) {
    case "flavours": {
      const flavours = sections.flavours;
      return (
        <Flavours
          key={key}
          title={flavours?.title}
          discoverTitle={flavours?.discoverTitle}
          flavourLabels={flavours?.tiles?.map((item) => item.label ?? "")}
          flavourTileImages={flavours?.tiles?.map((item) => item.image ?? "")}
          scaleTitle={flavours?.scaleTitle}
          scaleLabels={flavours?.scale?.map((item) => item.label ?? "")}
          scaleImages={flavours?.scale?.map((item) => item.image ?? "")}
          galleryImages={flavours?.galleryImages}
          centerImage={flavours?.centerImage}
          ctaLabel={flavours?.ctaLabel}
          ctaUrl={flavours?.ctaUrl}
        />
      );
    }
    case "partner": {
      const partner = sections.partner;
      return <Partner key={key} title={partner?.title} description={partner?.description} ctaLabel={partner?.ctaLabel} imageUrl={partner?.imageUrl} ctaUrl={partner?.ctaUrl} />;
    }
    case "locations": {
      const locations = sections.locations;
      return <Locations key={key} title={locations?.title} ctaLabel={locations?.ctaLabel} ctaUrl={locations?.ctaUrl} locationIds={locations?.locationIds} />;
    }
    default:
      return null;
  }
}

export default function HomeView({ home, navbar }: { home: Copies<Homepage>; navbar: Copies<NavbarContent | undefined> }) {
  const { locale } = useLocale();
  const page = home[locale] ?? home.en;
  const order = page?.order ?? [];
  const sections = page?.sections ?? {};

  return (
    <div>
      <Navbar copies={navbar} />
      <div className="relative">
        {order.includes("hero") && <Hero lines={sections.hero?.lines} videoUrl={sections.hero?.videoUrl} />}
        {order.includes("welcome") && (
          <Welcome
            headline={sections.welcome?.headline}
            accent={sections.welcome?.accent}
            description={sections.welcome?.description}
            backImage={sections.welcome?.backImage}
            frontImage={sections.welcome?.frontImage}
          />
        )}
      </div>
      {order.filter((key) => key !== "instagram").map((key) => renderSection(key, sections))}
      {order.includes("instagram") && <Instagram content={sections.instagram} followLabel={sections.instagram?.followLabel} />}
      <Footer />
    </div>
  );
}
