import type { Location } from "./redux/types";

const EMBEDDED_POSTCODE = /\b([A-Z]{1,2}\d[A-Z\d]?)\s*(\d[A-Z]{2})\b/i;

export type StoreLocationCard = {
  id: string;
  name: string;
  address: string;
  postcode: string;
  status: "open" | "closed" | "coming_soon";
  hours: string;
  lat: number | null;
  lng: number | null;
  phone: string;
  /** False hides the phone number on the store card. */
  showPhone: boolean;
  /** The number on the store card and map marker. Null uses the card position. */
  pinNumber: number | null;
  /** Google Maps link from the admin. Empty means build one from the address. */
  mapsUrl: string;
  /** Delivery partner links for this branch. Empty uses the site-wide link. */
  deliveryLinks: { uberEats: string; deliveroo: string; justEat: string };
};

/** Google Maps link for a branch: the admin link, else coordinates, else the address. */
export function branchMapsUrl(location: Pick<StoreLocationCard, "mapsUrl" | "lat" | "lng" | "address">): string {
  if (location.mapsUrl) return location.mapsUrl;
  const query = location.lat != null && location.lng != null ? `${location.lat},${location.lng}` : location.address;
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
}

export function mapStoreLocation(raw: Record<string, unknown>): Location | null {
  if (typeof raw.id !== "string" || !raw.id || typeof raw.name !== "string" || !raw.name.trim()) return null;
  return {
    id: raw.id,
    name: raw.name,
    address: typeof raw.address === "string" ? raw.address : "",
    hours: typeof raw.hours === "string" ? raw.hours : "",
    phone: typeof raw.phone === "string" ? raw.phone : "",
    show_phone: raw.show_phone !== false,
    status: typeof raw.status === "string" ? raw.status : "active",
    lat: coord(raw.lat),
    lng: coord(raw.lng),
    sort_order: typeof raw.sort_order === "number" ? raw.sort_order : 0,
    pin_number: typeof raw.pin_number === "number" ? raw.pin_number : null,
    google_maps_url: typeof raw.google_maps_url === "string" ? raw.google_maps_url : "",
    redirect_uber_eats: typeof raw.redirect_uber_eats === "string" ? raw.redirect_uber_eats : "",
    redirect_deliveroo: typeof raw.redirect_deliveroo === "string" ? raw.redirect_deliveroo : "",
    redirect_just_eat: typeof raw.redirect_just_eat === "string" ? raw.redirect_just_eat : "",
  };
}

function coord(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim() && Number.isFinite(Number(value))) return Number(value);
  return null;
}

export function toStoreLocationCard(location: Location): StoreLocationCard {
  const hours = location.hours?.trim() ?? "";
  const address = typeof location.address === "string" ? location.address : "";
  // "Coming Soon" in the hours is how a branch that is not open yet is marked.
  // It is its own state: the branch still shows on the site, just not as open.
  const comingSoon = /coming soon/i.test(hours);
  const status =
    location.status === "inactive" || hours.length === 0
      ? "closed"
      : comingSoon
        ? "coming_soon"
        : "open";
  const match = address.toUpperCase().match(EMBEDDED_POSTCODE);
  return {
    id: location.id,
    name: location.name,
    address,
    postcode: match ? `${match[1]} ${match[2]}` : "",
    status,
    hours: hours || "—",
    lat: location.lat,
    lng: location.lng,
    phone: location.phone,
    showPhone: location.show_phone !== false,
    pinNumber: location.pin_number ?? null,
    mapsUrl: location.google_maps_url?.trim() ?? "",
    deliveryLinks: {
      uberEats: location.redirect_uber_eats?.trim() ?? "",
      deliveroo: location.redirect_deliveroo?.trim() ?? "",
      justEat: location.redirect_just_eat?.trim() ?? "",
    },
  };
}
