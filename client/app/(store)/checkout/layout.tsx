import type { Metadata } from "next";
import { pageMetadata } from "@/lib/site";

// The cart is per visitor, so there is nothing here for search engines.
export const metadata: Metadata = pageMetadata({
  title: "Checkout",
  description: "Review your Crispies order and place it for delivery or click and collect.",
  path: "/checkout",
  noindex: true,
});

export default function CheckoutLayout({ children }: { children: React.ReactNode }) {
  return children;
}
