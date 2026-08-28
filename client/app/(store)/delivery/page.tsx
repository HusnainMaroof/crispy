import type { Metadata } from "next";
import DeliveryPage from "@/app/components/store/delivery-page";

export const metadata: Metadata = {
  title: "Get It Delivered — Crispies",
  description:
    "Choose your nearest Crispies branch and order delivery straight to your door.",
};

export default function DeliveryRoute() {
  return <DeliveryPage />;
}
