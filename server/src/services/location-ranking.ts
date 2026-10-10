import { haversineMiles, isValidCoordinate, type LatLng } from "../utils/geo.js";

/** The fields ranking needs. `id` is the database UUID, the only ID used for routing and selection. */
export type RankableBranch = {
  id: string;
  name: string;
  slug: string | null;
  address: string;
  postcode: string | null;
  lat: number | null;
  lng: number | null;
  status: string;
  hours: string;
};

export type BranchAvailability = "open" | "coming_soon";

export type RankedBranch = {
  branch: RankableBranch & { lat: number; lng: number };
  miles: number;
  availability: BranchAvailability;
};

/** The hours text "Coming Soon" is how a branch that is not open yet is marked. */
export function branchAvailability(branch: RankableBranch): BranchAvailability {
  return /coming soon/i.test(branch.hours) ? "coming_soon" : "open";
}

/**
 * A branch can take orders only when it is active, has hours, and is not
 * marked Coming Soon. Anything else is listed at most, never routed to.
 */
export function isOrderable(branch: RankableBranch): boolean {
  return branch.status === "active" && branch.hours.trim() !== "" && branchAvailability(branch) === "open";
}

/** Inactive branches are never public destinations, so they are excluded from every search. */
export function isSearchable(branch: RankableBranch): boolean {
  return branch.status === "active" && branch.hours.trim() !== "";
}

function hasCoordinates(branch: RankableBranch): branch is RankableBranch & { lat: number; lng: number } {
  return branch.lat !== null && branch.lng !== null && isValidCoordinate({ lat: branch.lat, lng: branch.lng });
}

/**
 * Nearest eligible branch inside the radius. An open branch always beats a
 * Coming Soon branch, even when the Coming Soon one is closer. Coming Soon is
 * used only when no open branch is in range.
 */
export function rankNearestBranch(
  branches: RankableBranch[],
  origin: LatLng,
  radiusMiles: number,
): RankedBranch | null {
  let best: RankedBranch | null = null;
  let bestComingSoon: RankedBranch | null = null;

  for (const branch of branches) {
    if (!isSearchable(branch) || !hasCoordinates(branch)) continue;
    const miles = haversineMiles(origin, { lat: branch.lat, lng: branch.lng });
    if (miles > radiusMiles) continue;

    const availability = branchAvailability(branch);
    const candidate: RankedBranch = { branch, miles, availability };
    if (availability === "open") {
      if (!best || miles < best.miles) best = candidate;
    } else if (!bestComingSoon || miles < bestComingSoon.miles) {
      bestComingSoon = candidate;
    }
  }

  return best ?? bestComingSoon;
}

/** Active branches that have no usable coordinates. Distance-based resolution cannot use them. */
export function branchesWithoutCoordinates(branches: RankableBranch[]): RankableBranch[] {
  return branches.filter((branch) => isSearchable(branch) && !hasCoordinates(branch));
}

const NAME_STOP_WORDS = new Set(["the", "and", "of", "london"]);

function normaliseText(value: string): string {
  return value
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Matches the query to a branch name. An exact name always wins. Otherwise the
 * query must be a whole word of the name (for example "Kilburn" in "Kilburn"),
 * so short fragments do not match by accident. Open branches are preferred.
 */
export function matchBranchName(branches: RankableBranch[], query: string): RankableBranch | null {
  const q = normaliseText(query);
  if (q.length < 3) return null;

  const searchable = branches.filter(isSearchable);
  const exact = searchable.find((branch) => normaliseText(branch.name) === q);
  if (exact) return exact;

  const wordMatches = searchable.filter((branch) => {
    const words = normaliseText(branch.name).split(" ").filter((word) => !NAME_STOP_WORDS.has(word));
    return words.includes(q);
  });
  return wordMatches.find(isOrderable) ?? wordMatches[0] ?? null;
}

/**
 * The coverage index stores branch slugs (for example "harrow-road"), while the
 * database and every API response use UUIDs. This maps a slug to the live
 * branch so the UUID is always the one returned to the client.
 */
export function findBranchBySlug(branches: RankableBranch[], slug: string): RankableBranch | null {
  return branches.find((branch) => branch.slug === slug) ?? null;
}
