import type { Metadata } from "next";
import StoreStatus from "@/app/components/store/store-status";

export const metadata: Metadata = {
  title: "Page not found",
  robots: { index: false, follow: false },
};

export default function NotFound() {
  return (
    <div className="min-h-screen bg-black text-white">
      <StoreStatus kind="not-found" />
    </div>
  );
}
