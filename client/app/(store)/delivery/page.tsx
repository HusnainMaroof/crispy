import type { Metadata } from "next";
import DeliveryPage from "@/app/components/store/delivery-page";
import { pageMetadata } from "@/lib/site";
import { BreadcrumbJsonLd } from "@/app/components/store/structured-data";

export const metadata: Metadata = pageMetadata({
  title: "Halal Burger and Chicken Delivery in London",
  description:
    "Get halal burgers and fried chicken delivered in London. Pick your nearest Crispies branch and order on Uber Eats, Deliveroo or Just Eat.",
  path: "/delivery",
});

export default function DeliveryRoute() {
  return (
    <>
      <BreadcrumbJsonLd items={[{ name: "Delivery", path: "/delivery" }]} />
      <DeliveryPage />
    </>
  );
}
