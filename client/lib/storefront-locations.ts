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

export function toStoreLocationCard(location: Location): StoreLocationCard {
  const hours = location.hours?.trim() ?? "";
  const closed = hours.length === 0 || /coming soon/i.test(hours);
  const match = location.address.toUpperCase().match(EMBEDDED_POSTCODE);
  return {
    id: location.id,
    name: location.name,
    address: location.address,
    postcode: match ? `${match[1]} ${match[2]}` : "",
    status: closed ? "closed" : "open",
    hours: hours || "—",
    lat: location.lat,
    lng: location.lng,
    phone: location.phone,
  };
}
