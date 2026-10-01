import type { Location } from "./redux/types";

const EMBEDDED_POSTCODE = /\b([A-Z]{1,2}\d[A-Z\d]?)\s*(\d[A-Z]{2})\b/i;

export type StoreLocationCard = {
  id: string;
  name: string;
  address: string;
  postcode: string;
  status: "open" | "closed";
  hours: string;
  lat: number | null;
  lng: number | null;
  phone: string;
};

export function mapStoreLocation(raw: Record<string, unknown>): Location | null {
  if (typeof raw.id !== "string" || !raw.id || typeof raw.name !== "string" || !raw.name.trim()) return null;
  return {
    id: raw.id,
    name: raw.name,
    address: typeof raw.address === "string" ? raw.address : "",
    hours: typeof raw.hours === "string" ? raw.hours : "",
    phone: typeof raw.phone === "string" ? raw.phone : "",
    status: typeof raw.status === "string" ? raw.status : "active",
    lat: coord(raw.lat),
    lng: coord(raw.lng),
    sort_order: typeof raw.sort_order === "number" ? raw.sort_order : 0,
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
  const closed = location.status === "inactive" || hours.length === 0 || /coming soon/i.test(hours);
  const match = address.toUpperCase().match(EMBEDDED_POSTCODE);
  return {
    id: location.id,
    name: location.name,
    address,
    postcode: match ? `${match[1]} ${match[2]}` : "",
    status: closed ? "closed" : "open",
    hours: hours || "—",
    lat: location.lat,
    lng: location.lng,
    phone: location.phone,
  };
}
