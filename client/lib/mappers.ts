import type { MenuItem, MenuCategory, Location, Settings } from "./redux/types";

export function mapMenuItem(raw: Record<string, unknown>): MenuItem {
  const price = Number(raw.price) || 0;
  return {
    id: raw.id as string,
    name: raw.name as string,
    description: raw.description as string,
    price: `£${price.toFixed(2)}`,
    priceValue: price,
    image: raw.image as string,
    badge: (raw.badge as string) ?? undefined,
    badgeVariant: (raw.badge_variant as "default" | "vegan") ?? undefined,
  };
}

export function mapMenuCategory(raw: Record<string, unknown>): MenuCategory {
  const items = (raw.items as Record<string, unknown>[]) ?? [];
  return {
    id: raw.id as string,
    number: raw.number as string,
    title: raw.title as string,
    image: raw.image as string,
    items: items.map(mapMenuItem),
  };
}

export function mapLocation(raw: Record<string, unknown>): Location {
  return {
    id: raw.id as string,
    name: raw.name as string,
    address: raw.address as string,
    hours: raw.hours as string,
    phone: raw.phone as string,
    lat: (raw.lat as number) ?? null,
    lng: (raw.lng as number) ?? null,
    sort_order: (raw.sort_order as number) ?? 0,
  };
}

export function mapSettings(raw: Record<string, unknown>): Settings {
  return {
    id: raw.id as number,
    delivery_fee: raw.delivery_fee as number,
    free_delivery_threshold: raw.free_delivery_threshold as number,
  };
}
