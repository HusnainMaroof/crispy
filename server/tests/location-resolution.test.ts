import assert from "node:assert/strict";
import { describe, it } from "node:test";
import "dotenv/config";
import { resolveLocation, type CoverageIndex, type ResolveDeps } from "../src/services/location-resolution.service.js";
import type { Geocoder, GeoCandidate } from "../src/services/geocoding.service.js";
import type { RankableBranch } from "../src/services/location-ranking.js";
import { findBranchBySlug, matchBranchName, rankNearestBranch } from "../src/services/location-ranking.js";
import { BadRequestException, ServiceUnavailableException } from "../src/utils/app-error.js";
import { haversineMiles } from "../src/utils/geo.js";
import { UpstreamError } from "../src/utils/upstream-json.js";
import { resolveLocationSchema } from "../src/validators/location.schema.js";

const HARROW: RankableBranch = {
  id: "6f1c0c2e-0000-4000-8000-000000000001", name: "Harrow Road", slug: "harrow-road",
  address: "412 Harrow Road, London W9 2HU", postcode: "W9 2HU",
  lat: 51.523411, lng: -0.196294, status: "active", hours: "9:00 AM - 11:00 PM",
};
const KILBURN: RankableBranch = {
  id: "6f1c0c2e-0000-4000-8000-000000000002", name: "Kilburn", slug: "kilburn",
  address: "302 Kilburn High Rd, London NW6 2DB", postcode: "NW6 2DB",
  lat: 51.544201, lng: -0.200361, status: "active", hours: "9:00 AM - 11:00 PM",
};
const TOWER: RankableBranch = {
  id: "6f1c0c2e-0000-4000-8000-000000000003", name: "Tower Hill", slug: "tower-hill",
  address: "Unit 2, Tower Hill Terrace, London EC3N 4EE", postcode: "EC3N 4EE",
  lat: 51.509201, lng: -0.078397, status: "active", hours: "9:00 AM - 11:00 PM",
};
const RUISLIP: RankableBranch = {
  id: "6f1c0c2e-0000-4000-8000-000000000004", name: "Ruislip", slug: "ruislip",
  address: "77 Victoria Road, Ruislip, London HA4 9BH", postcode: "HA4 9BH",
  lat: 51.5731, lng: -0.4238, status: "active", hours: "Coming Soon",
};
const INACTIVE: RankableBranch = {
  id: "6f1c0c2e-0000-4000-8000-000000000005", name: "Closed Test", slug: "closed-test",
  address: "1 Test Street, London", postcode: null,
  lat: 51.5234, lng: -0.1963, status: "inactive", hours: "9:00 AM - 11:00 PM",
};

const COVERAGE: CoverageIndex = {
  outcodes: {
    W9: { lat: 51.52341, lng: -0.19629, branchId: "harrow-road", miles: 0 },
    NW6: { lat: 51.5442, lng: -0.20036, branchId: "kilburn", miles: 0 },
  },
};

const NO_RESULT: Geocoder = {
  postcode: async () => null,
  outcode: async () => null,
  places: async () => [],
  address: async () => [],
};

function geocoderWith(overrides: Partial<Geocoder>): Geocoder {
  return { ...NO_RESULT, ...overrides };
}

function depsFor(
  branches: RankableBranch[],
  geo: Geocoder = NO_RESULT,
  options: { coverage?: CoverageIndex; radiusMiles?: number } = {},
): ResolveDeps {
  return {
    loadBranches: async () => branches,
    geocoder: geo,
    coverage: options.coverage ?? COVERAGE,
    radiusMiles: options.radiusMiles ?? 50,
  };
}

const HARROW_ORIGIN = { lat: 51.5234, lng: -0.1963 };
const timeout = () => new UpstreamError("timeout", "timed out");

describe("location resolution: input types", () => {
  it("resolves a full postcode to the nearest branch with an exact origin", async () => {
    const geo = geocoderWith({
      postcode: async () => ({ lat: 51.5234, lng: -0.1963, label: "W9 2HU" }),
    });
    const result = await resolveLocation({ query: "w9  2hu" }, depsFor([HARROW, KILBURN, TOWER], geo));
    assert.equal(result.status, "found");
    assert.equal(result.origin?.method, "postcode");
    assert.equal(result.origin?.approximate, false);
    assert.equal(result.branch?.id, HARROW.id);
    assert.equal(result.resolution, "nearest_branch");
  });

  it("marks an outward postcode as approximate", async () => {
    const geo = geocoderWith({
      outcode: async () => ({ lat: 51.5442, lng: -0.20036, label: "NW6" }),
    });
    const result = await resolveLocation({ query: "NW6" }, depsFor([HARROW, KILBURN], geo));
    assert.equal(result.origin?.method, "outcode");
    assert.equal(result.origin?.approximate, true);
    assert.equal(result.branch?.id, KILBURN.id);
  });

  it("resolves an address through the address provider when places are empty", async () => {
    const geo = geocoderWith({
      address: async () => [{ lat: 51.5442, lng: -0.2003, label: "302 Kilburn High Rd, Kilburn" }],
    });
    const result = await resolveLocation({ query: "302 Kilburn High Road, London" }, depsFor([HARROW, KILBURN], geo));
    assert.equal(result.origin?.method, "address");
    assert.equal(result.branch?.id, KILBURN.id);
  });

  it("uses direct coordinates without calling any geocoder", async () => {
    const geo = geocoderWith({
      postcode: async () => assert.fail("geocoder must not be called for coordinates"),
      places: async () => assert.fail("geocoder must not be called for coordinates"),
    });
    const result = await resolveLocation({ origin: HARROW_ORIGIN }, depsFor([HARROW, KILBURN], geo));
    assert.equal(result.origin?.method, "coordinates");
    assert.equal(result.branch?.id, HARROW.id);
  });

  it("rejects empty and whitespace-only queries", async () => {
    await assert.rejects(resolveLocation({ query: "   " }, depsFor([HARROW])), BadRequestException);
  });

  it("returns a not-found result for a US ZIP code instead of geocoding it", async () => {
    const result = await resolveLocation({ query: "90210" }, depsFor([HARROW], geocoderWith({
      postcode: async () => assert.fail("must not geocode a US ZIP"),
    })));
    assert.equal(result.status, "not_found");
    assert.match(result.message ?? "", /UK postcode/);
  });
});

describe("location resolution: coordinate validation", () => {
  it("rejects NaN, Infinity, and out-of-range coordinates", async () => {
    const bad = [
      { lat: Number.NaN, lng: 0 },
      { lat: 0, lng: Number.POSITIVE_INFINITY },
      { lat: 91, lng: 0 },
      { lat: 0, lng: 181 },
    ];
    for (const origin of bad) {
      await assert.rejects(resolveLocation({ origin }, depsFor([HARROW])), BadRequestException);
    }
  });

  it("schema accepts exactly one of query or origin", () => {
    assert.equal(resolveLocationSchema.safeParse({ query: "W9 2HU" }).success, true);
    assert.equal(resolveLocationSchema.safeParse({ origin: { lat: 51.5, lng: -0.1 } }).success, true);
    assert.equal(resolveLocationSchema.safeParse({}).success, false);
    assert.equal(resolveLocationSchema.safeParse({ query: "W9", origin: { lat: 51.5, lng: -0.1 } }).success, false);
  });

  it("schema rejects non-finite numbers, numeric strings, and unknown keys", () => {
    assert.equal(resolveLocationSchema.safeParse({ origin: { lat: Number.NaN, lng: 0 } }).success, false);
    assert.equal(resolveLocationSchema.safeParse({ origin: { lat: Number.POSITIVE_INFINITY, lng: 0 } }).success, false);
    assert.equal(resolveLocationSchema.safeParse({ origin: { lat: "51.5", lng: "-0.1" } }).success, false);
    assert.equal(resolveLocationSchema.safeParse({ query: "W9", extra: true }).success, false);
    assert.equal(resolveLocationSchema.safeParse({ query: "" }).success, false);
  });
});

describe("location resolution: no-result and ambiguity", () => {
  it("returns not_found when the provider has no such postcode", async () => {
    const result = await resolveLocation({ query: "ZZ9 9ZZ" }, depsFor([HARROW], NO_RESULT));
    assert.equal(result.status, "not_found");
    assert.match(result.message ?? "", /could not find that postcode/);
  });

  it("returns ambiguous candidates when they lead to different branches", async () => {
    const geo = geocoderWith({
      places: async () => [
        { lat: 51.5234, lng: -0.1963, label: "Harrow Road, W9" },
        { lat: 51.5092, lng: -0.0784, label: "Tower Hill, EC3N" },
      ],
    });
    const result = await resolveLocation({ query: "Main Street" }, depsFor([HARROW, TOWER], geo));
    assert.equal(result.status, "ambiguous");
    assert.equal(result.branch, null);
    assert.equal(result.candidates.length, 2);
  });

  it("does not report ambiguity when every candidate reaches the same branch", async () => {
    const geo = geocoderWith({
      places: async () => [
        { lat: 51.5234, lng: -0.1963, label: "Maida Vale" },
        { lat: 51.5240, lng: -0.1970, label: "Little Venice" },
      ],
    });
    const result = await resolveLocation({ query: "Maida Vale" }, depsFor([HARROW, TOWER], geo));
    assert.equal(result.status, "found");
    assert.equal(result.branch?.id, HARROW.id);
  });
});

describe("location resolution: provider failures", () => {
  it("falls back to the coverage index when the postcode provider times out", async () => {
    const geo = geocoderWith({ postcode: async () => { throw timeout(); } });
    const result = await resolveLocation({ query: "W9 2HU" }, depsFor([HARROW, KILBURN], geo));
    assert.equal(result.origin?.method, "local_index");
    assert.equal(result.origin?.approximate, true);
    assert.equal(result.branch?.id, HARROW.id);
  });

  it("throws a controlled 503 when the provider fails and no index entry exists", async () => {
    const geo = geocoderWith({ postcode: async () => { throw timeout(); } });
    await assert.rejects(
      resolveLocation({ query: "ZZ9 9ZZ" }, depsFor([HARROW], geo)),
      ServiceUnavailableException,
    );
  });

  it("throws a controlled 503 when both place and address providers fail", async () => {
    const geo = geocoderWith({
      places: async () => { throw timeout(); },
      address: async () => { throw new UpstreamError("http", "500"); },
    });
    await assert.rejects(
      resolveLocation({ query: "Some Road, London" }, depsFor([HARROW], geo)),
      ServiceUnavailableException,
    );
  });

  it("does not return a fabricated route or origin when every provider fails", async () => {
    const geo = geocoderWith({ places: async () => { throw timeout(); }, address: async () => [] });
    await assert.rejects(resolveLocation({ query: "Nowhere" }, depsFor([HARROW], geo)), ServiceUnavailableException);
  });
});

describe("location resolution: ranking and eligibility", () => {
  it("picks the closest eligible open branch", () => {
    const ranked = rankNearestBranch([HARROW, TOWER, KILBURN], HARROW_ORIGIN, 50);
    assert.equal(ranked?.branch.id, HARROW.id);
  });

  it("prefers an open branch over a closer Coming Soon branch", async () => {
    const result = await resolveLocation(
      { origin: { lat: RUISLIP.lat!, lng: RUISLIP.lng! } },
      depsFor([RUISLIP, HARROW]),
    );
    assert.equal(result.status, "found");
    assert.equal(result.branch?.id, HARROW.id);
  });

  it("uses a Coming Soon branch only when no open branch is in range", async () => {
    const result = await resolveLocation(
      { origin: { lat: RUISLIP.lat!, lng: RUISLIP.lng! } },
      depsFor([RUISLIP]),
    );
    assert.equal(result.status, "coming_soon");
    assert.equal(result.branch?.orderable, false);
    assert.equal(result.branch?.availability, "coming_soon");
  });

  it("returns not_found with the radius when no eligible branch is in range", async () => {
    const edinburgh = { lat: 55.9533, lng: -3.1883 };
    const result = await resolveLocation({ origin: edinburgh }, depsFor([HARROW, KILBURN, TOWER]));
    assert.equal(result.status, "not_found");
    assert.equal(result.branch, null);
    assert.match(result.message ?? "", /within 50 miles/);
    assert.equal(result.radiusMiles, 50);
  });

  it("honours a configured radius", async () => {
    const edinburgh = { lat: 55.9533, lng: -3.1883 };
    const result = await resolveLocation({ origin: edinburgh }, depsFor([HARROW], NO_RESULT, { radiusMiles: 1000 }));
    assert.equal(result.status, "found");
  });

  it("excludes inactive branches even when they are the closest", async () => {
    const result = await resolveLocation({ origin: HARROW_ORIGIN }, depsFor([INACTIVE, KILBURN]));
    assert.equal(result.branch?.id, KILBURN.id);
  });

  it("reports branches without coordinates and does not invent a distance for them", async () => {
    const noCoords: RankableBranch = { ...TOWER, id: "6f1c0c2e-0000-4000-8000-000000000009", name: "No Map", lat: null, lng: null };
    const result = await resolveLocation({ origin: HARROW_ORIGIN }, depsFor([noCoords, HARROW]));
    assert.equal(result.branch?.id, HARROW.id);
    assert.deepEqual(result.unlocatedBranches, [{ id: noCoords.id, name: "No Map" }]);
  });

  it("still matches a branch by name when its coordinates are missing", async () => {
    const noCoords: RankableBranch = { ...KILBURN, lat: null, lng: null };
    const result = await resolveLocation({ query: "Kilburn" }, depsFor([noCoords, HARROW]));
    assert.equal(result.resolution, "branch_name");
    assert.equal(result.branch?.id, KILBURN.id);
    assert.equal(result.branch?.lat, null);
    assert.equal(result.distance, null);
  });

  it("matches a branch name without calling a geocoder", async () => {
    const geo = geocoderWith({ places: async () => assert.fail("name match must not geocode") });
    const result = await resolveLocation({ query: "Tower Hill" }, depsFor([HARROW, TOWER], geo));
    assert.equal(result.resolution, "branch_name");
    assert.equal(result.branch?.id, TOWER.id);
  });
});

describe("location resolution: UUID mapping and coverage index", () => {
  it("maps a coverage index slug to the database UUID", () => {
    assert.equal(findBranchBySlug([HARROW, KILBURN], "harrow-road")?.id, HARROW.id);
    assert.equal(findBranchBySlug([HARROW], "unknown-slug"), null);
  });

  it("never returns a slug as the branch id after an outcode fallback (regression)", async () => {
    const geo = geocoderWith({ postcode: async () => { throw timeout(); } });
    const result = await resolveLocation({ query: "W9 2HU" }, depsFor([HARROW, KILBURN], geo));
    assert.equal(result.branch?.id, HARROW.id);
    assert.notEqual(result.branch?.id, "harrow-road");
  });

  it("matches branch names for exact and whole-word text only", () => {
    assert.equal(matchBranchName([HARROW, KILBURN], "kilburn")?.id, KILBURN.id);
    assert.equal(matchBranchName([HARROW, KILBURN], "Harrow")?.id, HARROW.id);
    assert.equal(matchBranchName([HARROW, KILBURN], "urb"), null);
  });
});

describe("location resolution: distance output", () => {
  it("returns Haversine straight-line miles with an explicit unit and type", async () => {
    const origin = HARROW_ORIGIN;
    const result = await resolveLocation({ origin }, depsFor([TOWER]));
    assert.ok((result.distance?.value ?? 0) > 0);
    const expected = Math.round(haversineMiles(origin, { lat: TOWER.lat!, lng: TOWER.lng! }) * 10) / 10;
    assert.equal(result.distance?.unit, "miles");
    assert.equal(result.distance?.type, "straight_line");
    assert.equal(result.distance?.value, expected);
  });
});
