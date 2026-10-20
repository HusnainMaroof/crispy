import type { Metadata } from "next";
import { BreadcrumbJsonLd, RestaurantsJsonLd } from "@/app/components/store/structured-data";
import { loadStoreLocations } from "@/lib/load-locations";
import { pageMetadata } from "@/lib/site";

export const metadata: Metadata = pageMetadata({
  title: "Halal Burger Restaurants in London",
  description:
    "Find your nearest Crispies halal burger and chicken restaurant in London. See every branch address, opening hours and directions on the map.",
  path: "/locations",
});

export default async function LocationsLayout({ children }: { children: React.ReactNode }) {
  const branches = await loadStoreLocations();
  return (
    <>
      <RestaurantsJsonLd branches={branches} />
      <BreadcrumbJsonLd items={[{ name: "Locations", path: "/locations" }]} />
      {children}
    </>
  );
}
