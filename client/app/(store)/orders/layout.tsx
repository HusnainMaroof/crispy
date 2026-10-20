import type { Metadata } from "next";
import { pageMetadata } from "@/lib/site";

// Order history belongs to one browser, so these pages stay out of search.
export const metadata: Metadata = pageMetadata({
  title: "Your Orders",
  description: "Track your Crispies orders and see your order history.",
  path: "/orders",
  noindex: true,
});

export default function OrdersLayout({ children }: { children: React.ReactNode }) {
  return children;
}
