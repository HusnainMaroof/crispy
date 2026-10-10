import { z } from "zod";
import { envConfig } from "../config/env.js";
import { logger } from "../middleware/logger.js";
import { cachedJson } from "../utils/cache.js";
import { getJson, UpstreamError } from "../utils/upstream-json.js";

export type GeoCandidate = { lat: number; lng: number; label: string };

/**
 * Provider interface. The resolver depends on this, not on a vendor, so a
 * paid or self-hosted geocoder can replace these methods later.
 * `postcode` and `outcode` return null for "no such code". Any other failure
 * throws UpstreamError.
 */
export interface Geocoder {
  postcode(postcode: string): Promise<GeoCandidate | null>;
  outcode(outcode: string): Promise<GeoCandidate | null>;
  places(query: string): Promise<GeoCandidate[]>;
  address(query: string): Promise<GeoCandidate[]>;
}

const POSTCODES_IO = "https://api.postcodes.io";
const POSTCODE_CACHE_SECONDS = 24 * 60 * 60;
const MAX_CANDIDATES = 5;

const postcodeBody = z.object({
  status: z.number().optional(),
  result: z.object({
    postcode: z.string(),
    latitude: z.number().finite(),
    longitude: z.number().finite(),
  }).nullable(),
});

const outcodeBody = z.object({
  status: z.number().optional(),
  result: z.object({
    outcode: z.string(),
    latitude: z.number().finite(),
    longitude: z.number().finite(),
  }).nullable(),
});

const placesBody = z.object({
  result: z.array(z.object({
    name_1: z.string().optional(),
    latitude: z.number().finite(),
    longitude: z.number().finite(),
    outcode: z.string().optional(),
  })).nullable(),
});

const nominatimBody = z.array(z.object({
  lat: z.string(),
  lon: z.string(),
  display_name: z.string(),
}));

function parseOrThrow<T>(schema: z.ZodType<T>, value: unknown): T {
  const parsed = schema.safeParse(value);
  if (!parsed.success) throw new UpstreamError("invalid", "Geocoder response did not match the expected shape");
  return parsed.data;
}

function fetchOptions() {
  return { timeoutMs: envConfig.LOCATION.GEOCODE_TIMEOUT_MS };
}

async function lookupPostcode(postcode: string): Promise<GeoCandidate | null> {
  const { status, body } = await getJson(
    `${POSTCODES_IO}/postcodes/${encodeURIComponent(postcode)}`,
    fetchOptions(),
  );
  if (status === 404) return null;
  const parsed = parseOrThrow(postcodeBody, body);
  if (!parsed.result) return null;
  return {
    lat: parsed.result.latitude,
    lng: parsed.result.longitude,
    label: parsed.result.postcode,
  };
}

async function lookupOutcode(outcode: string): Promise<GeoCandidate | null> {
  const { status, body } = await getJson(
    `${POSTCODES_IO}/outcodes/${encodeURIComponent(outcode)}`,
    fetchOptions(),
  );
  if (status === 404) return null;
  const parsed = parseOrThrow(outcodeBody, body);
  if (!parsed.result) return null;
  return {
    lat: parsed.result.latitude,
    lng: parsed.result.longitude,
    label: parsed.result.outcode,
  };
}

async function searchPlaces(query: string): Promise<GeoCandidate[]> {
  const params = new URLSearchParams({ q: query, limit: String(MAX_CANDIDATES) });
  const { body } = await getJson(`${POSTCODES_IO}/places?${params.toString()}`, fetchOptions());
  const parsed = parseOrThrow(placesBody, body);
  return (parsed.result ?? []).map((place) => ({
    lat: place.latitude,
    lng: place.longitude,
    label: [place.name_1, place.outcode].filter(Boolean).join(", "),
  }));
}

async function searchAddress(query: string): Promise<GeoCandidate[]> {
  if (!envConfig.LOCATION.NOMINATIM_ENABLED) return [];
  // countrycodes=gb keeps every result inside the UK. One request per search,
  // no retries, to stay within the Nominatim usage policy.
  const params = new URLSearchParams({
    q: query,
    format: "json",
    limit: String(MAX_CANDIDATES),
    countrycodes: "gb",
  });
  const { body } = await getJson(`${envConfig.LOCATION.NOMINATIM_URL}/search?${params.toString()}`, {
    timeoutMs: envConfig.LOCATION.GEOCODE_TIMEOUT_MS,
    headers: { "User-Agent": envConfig.LOCATION.USER_AGENT, "Accept-Language": "en-GB" },
  });
  const parsed = parseOrThrow(nominatimBody, body);
  const candidates: GeoCandidate[] = [];
  for (const hit of parsed) {
    const lat = Number(hit.lat);
    const lng = Number(hit.lon);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) continue;
    candidates.push({ lat, lng, label: hit.display_name.split(",").slice(0, 3).join(",").trim() });
  }
  return candidates;
}

/** Postcode and outcode answers rarely change, so they are cached per normalised code. */
export const geocoder: Geocoder = {
  postcode(postcode) {
    return cachedJson(`geocode:postcode:${postcode}`, POSTCODE_CACHE_SECONDS, () => lookupPostcode(postcode));
  },
  outcode(outcode) {
    return cachedJson(`geocode:outcode:${outcode}`, POSTCODE_CACHE_SECONDS, () => lookupOutcode(outcode));
  },
  places: searchPlaces,
  address: searchAddress,
};

/** Logs the failure kind only. Queries and provider URLs are not logged, they can contain addresses. */
export function logGeocoderFailure(scope: string, error: unknown): void {
  logger.warn({ scope, kind: error instanceof UpstreamError ? error.kind : "unknown" }, "geocoder failure");
}
