import { api } from "./api";

export type LatLng = { lat: number; lng: number };

/** Mirrors ResolveLocationResult on the server (services/location-resolution.service.ts). */
export type ResolveStatus = "found" | "coming_soon" | "ambiguous" | "not_found";

export type OriginMethod = "coordinates" | "postcode" | "outcode" | "place" | "address" | "local_index";

export type ResolveResponse = {
  status: ResolveStatus;
  message: string | null;
  origin: (LatLng & { label: string; approximate: boolean; method: OriginMethod }) | null;
  branch: {
    id: string;
    name: string;
    address: string;
    postcode: string | null;
    lat: number | null;
    lng: number | null;
    availability: "open" | "coming_soon";
    orderable: boolean;
  } | null;
  resolution: "branch_name" | "nearest_branch" | null;
  distance: { value: number; unit: "miles"; type: "straight_line" } | null;
  candidates: (LatLng & { label: string })[];
  radiusMiles: number;
  unlocatedBranches: { id: string; name: string }[];
};

export function resolveByQuery(query: string): Promise<ResolveResponse> {
  return api.post<ResolveResponse>("/store/locations/resolve", { query });
}

export function resolveByOrigin(point: LatLng): Promise<ResolveResponse> {
  return api.post<ResolveResponse>("/store/locations/resolve", {
    origin: { lat: point.lat, lng: point.lng },
  });
}

/**
 * External navigation link. Built only from validated numbers, the same way
 * the server builds it. With no origin, the app opens directions from the
 * user's current position.
 */
export function navigationLink(origin: LatLng | null, destination: LatLng): string {
  const params = new URLSearchParams({ api: "1" });
  if (origin) params.set("origin", `${origin.lat},${origin.lng}`);
  params.set("destination", `${destination.lat},${destination.lng}`);
  params.set("travelmode", "driving");
  return `https://www.google.com/maps/dir/?${params.toString()}`;
}

export function formatMiles(miles: number): string {
  return `${miles.toFixed(1)} miles`;
}

export function describeGeolocationError(code: number): string {
  if (code === 1) return "Location permission was denied. You can enter a postcode instead.";
  if (code === 2) return "Your location could not be found. Enter a postcode instead.";
  if (code === 3) return "Finding your location took too long. Try again, or enter a postcode.";
  return "Your location is not available. Enter a postcode instead.";
}

/**
 * Stale-response guard. Each lookup takes a ticket. Only the newest ticket may
 * write results, so a slow earlier search cannot overwrite a newer one. cancel()
 * invalidates every pending ticket, for example on unmount.
 */
export function createLatestGate() {
  let current = 0;
  return {
    next() {
      current += 1;
      const ticket = current;
      return { isCurrent: () => ticket === current };
    },
    cancel() {
      current += 1;
    },
  };
}
