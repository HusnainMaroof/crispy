import type { Metadata } from "next";
import { pageMetadata } from "@/lib/site";
import { BreadcrumbJsonLd } from "@/app/components/store/structured-data";

export const metadata: Metadata = pageMetadata({
  title: "Menu: Halal Burgers, Chicken and Wraps",
  description:
    "See the Crispies menu: halal burgers, fried chicken, wraps, sides, drinks and desserts. Order online for delivery or click and collect in London.",
  path: "/menu",
});

export default function MenuLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <BreadcrumbJsonLd items={[{ name: "Menu", path: "/menu" }]} />
      {children}
    </>
  );
}
