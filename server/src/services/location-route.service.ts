import { getLocationById } from "./admin.service.js";
import { isOrderable, type RankableBranch } from "./location-ranking.js";
import { configuredRoutingProvider, requestRoadRoute, ROUTE_ATTRIBUTION, toRouteUnits, type RoutingProvider, type TravelMode } from "./routing.service.js";
import { ConflictException, NotFoundException } from "../utils/app-error.js";
import { isValidCoordinate, type LatLng } from "../utils/geo.js";

export type LocationRouteInput = {
  origin: LatLng;
  destinationLocationId: string;
  travelMode: TravelMode;
};

/**
 * Link to open turn-by-turn navigation in an external app. Built only from
 * validated numbers, so it carries no customer text and no secrets.
 */
export function navigationUrl(origin: LatLng, destination: LatLng, mode: TravelMode): string {
  const params = new URLSearchParams({
    api: "1",
    origin: `${origin.lat},${origin.lng}`,
    destination: `${destination.lat},${destination.lng}`,
    travelmode: mode,
  });
  return `https://www.google.com/maps/dir/?${params.toString()}`;
}

/**
 * Road route from the customer's origin to a canonical branch. The destination
 * is read by UUID from the database and must be orderable. The client never
 * supplies branch coordinates or branch details.
 */
export async function getLocationRoute(
  input: LocationRouteInput,
  provider: RoutingProvider | null = configuredRoutingProvider(),
) {
  if (!isValidCoordinate(input.origin)) throw new ConflictException("Origin coordinates are out of range");

  const branch = await getLocationById(input.destinationLocationId, { read: true });
  if (branch.lat === null || branch.lng === null) {
    throw new ConflictException("This branch has no map position, so a route cannot be shown");
  }
  const rankable: RankableBranch = { ...branch, lat: branch.lat, lng: branch.lng };
  if (!isOrderable(rankable)) {
    throw new ConflictException("This branch is not open for orders, so a route cannot be shown");
  }

  const destination = { lat: branch.lat, lng: branch.lng };
  const route = await requestRoadRoute(provider, input.origin, destination, input.travelMode);
  if (!route) throw new NotFoundException("No driving route was found between these points");

  return {
    origin: input.origin,
    destination: { id: branch.id, name: branch.name, lat: branch.lat, lng: branch.lng },
    travelMode: input.travelMode,
    ...toRouteUnits(route),
    geometry: { type: "LineString" as const, coordinates: route.coordinates },
    attribution: ROUTE_ATTRIBUTION,
    navigationUrl: navigationUrl(input.origin, destination, input.travelMode),
  };
}
