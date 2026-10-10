import coverage from "../data/location-coverage.json" with { type: "json" };
import { envConfig } from "../config/env.js";
import { getLocations } from "./admin.service.js";
import { geocoder, logGeocoderFailure, type GeoCandidate, type Geocoder } from "./geocoding.service.js";
import {
  branchAvailability,
  branchesWithoutCoordinates,
  findBranchBySlug,
  isOrderable,
  matchBranchName,
  rankNearestBranch,
  type RankableBranch,
} from "./location-ranking.js";
import { BadRequestException, ServiceUnavailableException } from "../utils/app-error.js";
import { roundMiles, isValidCoordinate, type LatLng } from "../utils/geo.js";
import { isUsZip, parseUkPostcode, type ParsedPostcode } from "../utils/uk-postcode.js";

export type ResolveLocationInput = { query: string } | { origin: LatLng };

export type OriginMethod = "coordinates" | "postcode" | "outcode" | "place" | "address" | "local_index";

export type OriginPoint = {
  lat: number;
  lng: number;
  label: string;
  /** True for district centres and place centres. Distances from them are not exact. */
  approximate: boolean;
  method: OriginMethod;
};

export type ResolveStatus = "found" | "coming_soon" | "ambiguous" | "not_found";

export type BranchSummary = {
  id: string;
  name: string;
  address: string;
  postcode: string | null;
  lat: number | null;
  lng: number | null;
  availability: "open" | "coming_soon";
  /** False for Coming Soon branches. They can be shown but not ordered from. */
  orderable: boolean;
};

export type ResolveLocationResult = {
  status: ResolveStatus;
  message: string | null;
  origin: OriginPoint | null;
  branch: BranchSummary | null;
  /** "branch_name": the customer typed a branch name, so there is no origin. */
  resolution: "branch_name" | "nearest_branch" | null;
  /** Straight-line (Haversine) distance. Never a road distance. */
  distance: { value: number; unit: "miles"; type: "straight_line" } | null;
  /** Only for ambiguous results. Pick one and send its coordinates back as `origin`. */
  candidates: { label: string; lat: number; lng: number }[];
  radiusMiles: number;
  /** Active branches with no coordinates. Distance cannot be used for them. */
  unlocatedBranches: { id: string; name: string }[];
};

export type OutcodeEntry = { lat: number; lng: number; branchId: string; miles: number };
export type CoverageIndex = { outcodes: Record<string, OutcodeEntry> };

export type ResolveDeps = {
  loadBranches: () => Promise<RankableBranch[]>;
  geocoder: Geocoder;
  coverage: CoverageIndex;
  radiusMiles: number;
};

const MAX_CANDIDATES = 5;

const MESSAGES = {
  postcodeNotFound: "We could not find that postcode. Check it and try again.",
  areaNotFound: "We could not find that area. Try a nearby town, city, or UK postcode.",
  usZip: "Please enter a UK postcode such as W9 2HU, or an area like Kilburn.",
  unavailable: "Location search is temporarily unavailable. Try again shortly, or use your current location.",
  ambiguous: "That search matches more than one place. Choose the right one.",
} as const;

function outOfRange(radiusMiles: number, where: string): string {
  return `No Crispies branch within ${radiusMiles} miles of ${where}. Try another area or postcode.`;
}

function summarise(branch: RankableBranch): BranchSummary {
  return {
    id: branch.id,
    name: branch.name,
    address: branch.address,
    postcode: branch.postcode,
    lat: branch.lat,
    lng: branch.lng,
    availability: branchAvailability(branch),
    orderable: isOrderable(branch),
  };
}

function baseResult(radiusMiles: number, branches: RankableBranch[]): ResolveLocationResult {
  return {
    status: "not_found",
    message: null,
    origin: null,
    branch: null,
    resolution: null,
    distance: null,
    candidates: [],
    radiusMiles,
    unlocatedBranches: branchesWithoutCoordinates(branches).map((branch) => ({ id: branch.id, name: branch.name })),
  };
}

function coordinateLabel(point: LatLng): string {
  return `${point.lat.toFixed(5)}, ${point.lng.toFixed(5)}`;
}

/** Ranks the branches from a known origin. Shared by coordinate, postcode, and place lookups. */
function rankFromOrigin(branches: RankableBranch[], origin: OriginPoint, radiusMiles: number): ResolveLocationResult {
  const ranked = rankNearestBranch(branches, origin, radiusMiles);
  const base = { ...baseResult(radiusMiles, branches), origin };
  if (!ranked) return { ...base, message: outOfRange(radiusMiles, origin.label) };
  return {
    ...base,
    status: ranked.availability === "open" ? "found" : "coming_soon",
    branch: summarise(ranked.branch),
    resolution: "nearest_branch",
    distance: { value: roundMiles(ranked.miles), unit: "miles", type: "straight_line" },
  };
}

/**
 * Used only when the geocoder is down. The district centre comes from the
 * bundled coverage index. The branch is still ranked from live coordinates.
 * If live ranking finds nothing, the index's branch is used. Its slug is
 * mapped to the database UUID, so the response never carries a slug.
 */
function outcodeFallback(
  deps: ResolveDeps,
  branches: RankableBranch[],
  outcode: string,
): ResolveLocationResult | null {
  const entry = deps.coverage.outcodes[outcode];
  if (!entry) return null;

  const origin: OriginPoint = {
    lat: entry.lat,
    lng: entry.lng,
    label: outcode,
    approximate: true,
    method: "local_index",
  };
  const live = rankFromOrigin(branches, origin, deps.radiusMiles);
  if (live.branch) return live;

  const indexed = findBranchBySlug(branches, entry.branchId);
  if (!indexed || indexed.lat === null || indexed.lng === null) return live;
  return {
    ...live,
    status: isOrderable(indexed) ? "found" : "coming_soon",
    branch: summarise(indexed),
    resolution: "nearest_branch",
    distance: { value: roundMiles(entry.miles), unit: "miles", type: "straight_line" },
    message: null,
  };
}

async function resolvePostcode(
  deps: ResolveDeps,
  branches: RankableBranch[],
  parsed: ParsedPostcode,
): Promise<ResolveLocationResult> {
  let hit: GeoCandidate | null;
  try {
    hit = parsed.full
      ? await deps.geocoder.postcode(parsed.formatted)
      : await deps.geocoder.outcode(parsed.outcode);
  } catch (error) {
    logGeocoderFailure("postcode", error);
    const fallback = outcodeFallback(deps, branches, parsed.outcode);
    if (fallback) return fallback;
    throw new ServiceUnavailableException(MESSAGES.unavailable);
  }

  // The provider answered "no such code". That is a real answer, so no fallback.
  if (!hit) {
    return { ...baseResult(deps.radiusMiles, branches), message: parsed.full ? MESSAGES.postcodeNotFound : MESSAGES.areaNotFound };
  }
  return rankFromOrigin(branches, {
    lat: hit.lat,
    lng: hit.lng,
    label: parsed.formatted,
    approximate: !parsed.full,
    method: parsed.full ? "postcode" : "outcode",
  }, deps.radiusMiles);
}

/**
 * Free text (address or place). Places are tried first, then addresses. When
 * the candidates would lead to different branches, the result is "ambiguous"
 * and the customer must choose. The search never picks one silently.
 */
async function resolveFreeText(
  deps: ResolveDeps,
  branches: RankableBranch[],
  query: string,
): Promise<ResolveLocationResult> {
  let candidates: GeoCandidate[] = [];
  let method: "place" | "address" = "place";
  let failures = 0;

  try {
    candidates = await deps.geocoder.places(query);
  } catch (error) {
    failures += 1;
    logGeocoderFailure("places", error);
  }

  if (candidates.length === 0) {
    method = "address";
    try {
      candidates = await deps.geocoder.address(query);
    } catch (error) {
      failures += 1;
      logGeocoderFailure("address", error);
    }
  }

  if (candidates.length === 0) {
    if (failures > 0) throw new ServiceUnavailableException(MESSAGES.unavailable);
    return { ...baseResult(deps.radiusMiles, branches), message: MESSAGES.areaNotFound };
  }

  const options = candidates.slice(0, MAX_CANDIDATES);
  const nearestIds = new Set(
    options.map((candidate) => rankNearestBranch(branches, candidate, deps.radiusMiles)?.branch.id ?? "none"),
  );
  if (nearestIds.size > 1) {
    return {
      ...baseResult(deps.radiusMiles, branches),
      status: "ambiguous",
      message: MESSAGES.ambiguous,
      candidates: options.map((candidate) => ({ label: candidate.label, lat: candidate.lat, lng: candidate.lng })),
    };
  }

  const first = options[0]!;
  return rankFromOrigin(branches, {
    lat: first.lat,
    lng: first.lng,
    label: first.label,
    approximate: method === "place",
    method,
  }, deps.radiusMiles);
}

/** Entry point. Named application exceptions are mapped by the central error handler. */
export async function resolveLocation(
  input: ResolveLocationInput,
  deps: ResolveDeps = defaultDeps(),
): Promise<ResolveLocationResult> {
  if ("origin" in input) {
    if (!isValidCoordinate(input.origin)) throw new BadRequestException("Coordinates are out of range");
    const branches = await deps.loadBranches();
    return rankFromOrigin(branches, {
      lat: input.origin.lat,
      lng: input.origin.lng,
      label: coordinateLabel(input.origin),
      approximate: false,
      method: "coordinates",
    }, deps.radiusMiles);
  }

  const query = input.query.trim();
  if (!query) throw new BadRequestException("Enter a postcode, address, or place");
  if (isUsZip(query)) return { ...baseResult(deps.radiusMiles, []), message: MESSAGES.usZip };

  const branches = await deps.loadBranches();
  const parsed = parseUkPostcode(query);

  if (parsed) return resolvePostcode(deps, branches, parsed);

  // Branch names are matched only for non-postcode text, so a postcode never
  // resolves to a branch by name.
  const byName = matchBranchName(branches, query);
  if (byName) {
    return {
      status: isOrderable(byName) ? "found" : "coming_soon",
      message: null,
      origin: null,
      branch: summarise(byName),
      resolution: "branch_name",
      distance: null,
      candidates: [],
      radiusMiles: deps.radiusMiles,
      unlocatedBranches: [],
    };
  }

  return resolveFreeText(deps, branches, query);
}

/** Active branches for ranking. Reuses getLocations so its cache and invalidation apply. */
export async function loadActiveBranches(): Promise<RankableBranch[]> {
  const rows = await getLocations({ activeOnly: true, read: true, cache: true });
  return rows.map((row) => ({
    id: row.id,
    name: row.name,
    slug: row.slug,
    address: row.address,
    postcode: row.postcode,
    lat: row.lat,
    lng: row.lng,
    status: row.status,
    hours: row.hours,
  }));
}

function defaultDeps(): ResolveDeps {
  return {
    loadBranches: loadActiveBranches,
    geocoder,
    coverage: coverage as CoverageIndex,
    radiusMiles: envConfig.LOCATION.RADIUS_MILES,
  };
}
