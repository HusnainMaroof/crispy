import { z } from "zod";
import { envConfig } from "../config/env.js";
import { logger } from "../middleware/logger.js";
import { ServiceUnavailableException } from "../utils/app-error.js";
import { getJson, UpstreamError } from "../utils/upstream-json.js";
import { isValidCoordinate, milesToKm, type LatLng } from "../utils/geo.js";

export type TravelMode = "driving";

/** A real road route. Distance and duration come from the provider, never from a straight line. */
export type RoadRoute = {
  distanceMeters: number;
  durationSeconds: number;
  /** GeoJSON order: [lng, lat]. */
  coordinates: [number, number][];
};

/**
 * Provider interface. Return null when the provider has no route between the
 * points. Throw UpstreamError for any other failure. Swap the adapter here to
 * change routing vendor without touching the location feature.
 */
export interface RoutingProvider {
  readonly name: string;
  route(origin: LatLng, destination: LatLng, mode: TravelMode): Promise<RoadRoute | null>;
}

const osrmBody = z.object({
  code: z.string(),
  routes: z.array(z.object({
    distance: z.number().finite().nonnegative(),
    duration: z.number().finite().nonnegative(),
    geometry: z.object({
      type: z.literal("LineString"),
      coordinates: z.array(z.tuple([z.number(), z.number()])).min(2),
    }),
  })).optional(),
});

/** OSRM-compatible adapter (OSRM, or any service that speaks the same route/v1 API). */
export function createOsrmProvider(baseUrl: string, profile: string, timeoutMs: number): RoutingProvider {
  return {
    name: "osrm",
    async route(origin, destination) {
      // The profile is set by the server operator, never by the customer.
      // Coordinates are validated numbers, so the URL carries no free text.
      const path = [origin, destination].map((point) => `${point.lng},${point.lat}`).join(";");
      const url = `${baseUrl}/route/v1/${encodeURIComponent(profile)}/${path}?overview=full&geometries=geojson&alternatives=false&steps=false`;

      const { body } = await getJson(url, { timeoutMs });
      const parsed = osrmBody.safeParse(body);
      if (!parsed.success) throw new UpstreamError("invalid", "Routing response did not match the expected shape");

      // OSRM answers NoRoute or NoSegment when the points are not connected.
      if (parsed.data.code !== "Ok" || !parsed.data.routes || parsed.data.routes.length === 0) return null;

      const route = parsed.data.routes[0]!;
      const coordinates = route.geometry.coordinates;
      const valid = coordinates.every(([lng, lat]) => isValidCoordinate({ lat, lng }));
      if (!valid) throw new UpstreamError("invalid", "Routing geometry contained invalid coordinates");

      return {
        distanceMeters: route.distance,
        durationSeconds: route.duration,
        coordinates: coordinates as [number, number][],
      };
    },
  };
}

/** Builds the provider from configuration. Null when ROUTING_OSRM_URL is empty, which turns in-app routing off. */
export function configuredRoutingProvider(): RoutingProvider | null {
  const { OSRM_URL, OSRM_PROFILE, TIMEOUT_MS } = envConfig.ROUTING;
  if (!OSRM_URL) return null;
  return createOsrmProvider(OSRM_URL, OSRM_PROFILE, TIMEOUT_MS);
}

export const ROUTE_ATTRIBUTION = "Route data: OpenStreetMap contributors. Routing service as configured by Crispies.";

export const ROUTE_UNCONFIGURED_MESSAGE =
  "In-app route preview is not available yet. Open the branch in your maps app instead.";

export const ROUTE_FAILED_MESSAGE =
  "The route service is unavailable right now. Open the branch in your maps app instead.";

/**
 * Runs one route request. Maps every provider failure to a controlled 503 and
 * logs only the failure kind, never the coordinates.
 */
export async function requestRoadRoute(
  provider: RoutingProvider | null,
  origin: LatLng,
  destination: LatLng,
  mode: TravelMode,
): Promise<RoadRoute | null> {
  if (!provider) throw new ServiceUnavailableException(ROUTE_UNCONFIGURED_MESSAGE);
  try {
    return await provider.route(origin, destination, mode);
  } catch (error) {
    logger.warn({ provider: provider.name, kind: error instanceof UpstreamError ? error.kind : "unknown" }, "routing failure");
    throw new ServiceUnavailableException(ROUTE_FAILED_MESSAGE);
  }
}

export function toRouteUnits(route: RoadRoute) {
  const miles = route.distanceMeters / 1609.344;
  return {
    distance: { value: Math.round(miles * 10) / 10, unit: "miles" as const },
    distanceKm: Math.round(milesToKm(miles) * 10) / 10,
    duration: { value: Math.round(route.durationSeconds / 60), unit: "minutes" as const },
  };
}
