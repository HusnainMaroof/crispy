import { cache } from "react";
import { mapStoreLocation, toStoreLocationCard, type StoreLocationCard } from "@/lib/storefront-locations";

export const loadStoreLocations = cache(async (): Promise<StoreLocationCard[]> => {
  try {
    const base = process.env.NEXT_PUBLIC_API_BASE_URL ?? "";
    const res = await fetch(`${base}/api/store/locations`, { next: { revalidate: 15 } });
    if (!res.ok) return [];
    const body = await res.json() as { data?: unknown };
    if (!Array.isArray(body.data)) return [];
    return body.data.flatMap((row) => {
      if (!row || typeof row !== "object") return [];
      const location = mapStoreLocation(row as Record<string, unknown>);
      return location ? [toStoreLocationCard(location)] : [];
    });
  } catch {
    return [];
  }
});
