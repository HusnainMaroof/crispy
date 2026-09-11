import coverage from "./location-coverage.json";

export const SEARCH_RADIUS_MILES = coverage.radiusMiles ?? 50;

export type SearchBranch = {
  id: string;
  name: string;
  address: string;
  lat: number;
  lng: number;
  postcode?: string;
};

type GeocodeResult = {
  lat: number;
  lng: number;
  label: string;
};

export type BranchMatchKind = "exact" | "strong" | "partial" | "fuzzy";

type BranchTextMatch = {
  branch: SearchBranch;
  kind: BranchMatchKind;
  score: number;
};

type ParsedPostcode = {
  compact: string;
  formatted: string;
  outcode: string;
  full: boolean;
};

const EARTH_RADIUS_MILES = 3958.8;
const FULL_UK_POSTCODE =
  /^([A-Z]{1,2}\d[A-Z\d]?)(\d[A-Z]{2})$/;
const OUTWARD_UK_POSTCODE = /^[A-Z]{1,2}\d[A-Z\d]?$/;
const EMBEDDED_FULL_POSTCODE =
  /\b([A-Z]{1,2}\d[A-Z\d]?)\s*(\d[A-Z]{2})\b/;
const US_ZIP = /^\d{5}(?:-?\d{4})?$/;

const IGNORE_ADDRESS_TOKENS = new Set([
  "london",
  "road",
  "rd",
  "high",
  "unit",
  "station",
  "terrace",
  "lambeth",
  "westminster",
  "castle",
  "the",
  "and",
  "street",
  "st",
  "avenue",
  "ave",
  "lane",
  "close",
  "drive",
  "way",
  "place",
  "square",
]);

const outcodeIndex = coverage.outcodes as Record<
  string,
  { lat: number; lng: number; branchId: string; miles: number }
>;
const exactPostcodes = coverage.postcodes as Record<
  string,
  { branchId: string; postcode: string }
>;

const normalize = (value: string) =>
  value
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

export function compactPostcode(raw: string) {
  return raw.replace(/[^a-z0-9]/gi, "").toUpperCase();
}

export function formatPostcode(raw: string) {
  const compact = compactPostcode(raw);
  if (compact.length < 5) return compact;
  return `${compact.slice(0, -3)} ${compact.slice(-3)}`;
}

export function parseUkPostcode(query: string): ParsedPostcode | null {
  const trimmed = query.trim();
  if (!trimmed) return null;

  const compactWhole = compactPostcode(trimmed);
  const fullWhole = compactWhole.match(FULL_UK_POSTCODE);
  if (fullWhole) {
    return {
      compact: compactWhole,
      formatted: `${fullWhole[1]} ${fullWhole[2]}`,
      outcode: fullWhole[1],
      full: true,
    };
  }

  const upper = trimmed.toUpperCase();
  const embedded = upper.match(EMBEDDED_FULL_POSTCODE);
  if (embedded) {
    const compact = `${embedded[1]}${embedded[2]}`;
    return {
      compact,
      formatted: `${embedded[1]} ${embedded[2]}`,
      outcode: embedded[1],
      full: true,
    };
  }

  if (OUTWARD_UK_POSTCODE.test(compactWhole)) {
    return {
      compact: compactWhole,
      formatted: compactWhole,
      outcode: compactWhole,
      full: false,
    };
  }

  const tokens = upper.split(/[^A-Z0-9]+/).filter(Boolean);
  for (const token of tokens) {
    if (OUTWARD_UK_POSTCODE.test(token) && outcodeIndex[token]) {
      return {
        compact: token,
        formatted: token,
        outcode: token,
        full: false,
      };
    }
  }

  return null;
}

function levenshtein(a: string, b: string) {
  if (a === b) return 0;
  if (!a.length) return b.length;
  if (!b.length) return a.length;

  const prev = Array.from({ length: b.length + 1 }, (_, i) => i);
  const curr = new Array<number>(b.length + 1);

  for (let i = 1; i <= a.length; i++) {
    curr[0] = i;
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      curr[j] = Math.min(prev[j] + 1, curr[j - 1] + 1, prev[j - 1] + cost);
    }
    for (let j = 0; j <= b.length; j++) prev[j] = curr[j];
  }

  return prev[b.length];
}

function similarity(a: string, b: string) {
  if (!a || !b) return 0;
  const maxLen = Math.max(a.length, b.length);
  if (maxLen === 0) return 1;
  return 1 - levenshtein(a, b) / maxLen;
}

function branchTokens(branch: SearchBranch) {
  const nameWords = normalize(branch.name).split(" ").filter(Boolean);
  const addressWords = normalize(branch.address)
    .split(" ")
    .filter((word) => word.length >= 3 && !IGNORE_ADDRESS_TOKENS.has(word));
  return { nameWords, addressWords, name: normalize(branch.name) };
}

function branchById(branches: SearchBranch[], id: string) {
  return branches.find((branch) => branch.id === id) ?? null;
}

/** Match branch names / keywords with typo tolerance and partial words. */
export function findBranchTextMatch(
  branches: SearchBranch[],
  query: string,
): BranchTextMatch | null {
  const q = normalize(query);
  if (!q || q.length < 2) return null;

  const qCompact = q.replace(/\s+/g, "");
  const qTokens = q.split(" ").filter((token) => token.length >= 2);

  let best: BranchTextMatch | null = null;

  for (const branch of branches) {
    const { nameWords, addressWords, name } = branchTokens(branch);
    const nameCompact = name.replace(/\s+/g, "");
    const candidates: BranchTextMatch[] = [];

    if (name === q) {
      candidates.push({ branch, kind: "exact", score: 400 });
    }

    if (name.includes(q) || q.includes(name)) {
      candidates.push({ branch, kind: "strong", score: 280 });
    }

    for (const word of nameWords) {
      if (word.startsWith(q) || q.startsWith(word)) {
        candidates.push({ branch, kind: "strong", score: 240 });
      }
    }

    for (const qToken of qTokens) {
      if (qToken.length < 3) continue;

      if (nameWords.some((word) => word.includes(qToken) || qToken.includes(word))) {
        candidates.push({ branch, kind: "partial", score: 220 });
      }

      for (const word of nameWords) {
        const sim = similarity(word, qToken);
        if (sim >= 0.72) {
          candidates.push({ branch, kind: "partial", score: 200 + sim * 40 });
        }
      }

      for (const word of addressWords) {
        if (word.includes(qToken) || qToken.includes(word)) {
          candidates.push({ branch, kind: "partial", score: 185 });
        }
      }
    }

    if (qCompact.length >= 4) {
      const nameSim = similarity(nameCompact, qCompact);
      if (nameSim >= 0.68) {
        candidates.push({ branch, kind: "fuzzy", score: 160 + nameSim * 80 });
      }

      for (const word of [...nameWords, ...addressWords]) {
        if (word.length < 4) continue;
        const wordSim = similarity(word, qCompact);
        if (wordSim >= 0.74) {
          candidates.push({ branch, kind: "fuzzy", score: 150 + wordSim * 70 });
        }
      }
    }

    for (const candidate of candidates) {
      if (candidate.score > (best?.score ?? 0)) {
        best = candidate;
      }
    }
  }

  if (!best || best.score < 150) return null;
  return best;
}

async function lookupPostcode(postcode: string): Promise<GeocodeResult | null> {
  const res = await fetch(
    `https://api.postcodes.io/postcodes/${encodeURIComponent(postcode)}`,
    { headers: { Accept: "application/json" } },
  );
  if (!res.ok) return null;

  const body = (await res.json()) as {
    status?: number;
    result?: { latitude: number; longitude: number; postcode: string };
  };

  if (body.status !== 200 || !body.result) return null;

  return {
    lat: body.result.latitude,
    lng: body.result.longitude,
    label: body.result.postcode,
  };
}

async function lookupOutcode(outcode: string): Promise<GeocodeResult | null> {
  const res = await fetch(
    `https://api.postcodes.io/outcodes/${encodeURIComponent(outcode.toUpperCase())}`,
    { headers: { Accept: "application/json" } },
  );
  if (!res.ok) return null;

  const body = (await res.json()) as {
    status?: number;
    result?: { latitude: number; longitude: number; outcode: string };
  };

  if (body.status !== 200 || !body.result) return null;

  return {
    lat: body.result.latitude,
    lng: body.result.longitude,
    label: body.result.outcode,
  };
}

async function lookupPlace(query: string): Promise<GeocodeResult | null> {
  const params = new URLSearchParams({ q: query, limit: "5" });
  const res = await fetch(`https://api.postcodes.io/places?${params.toString()}`, {
    headers: { Accept: "application/json" },
  });
  if (!res.ok) return null;

  const body = (await res.json()) as {
    status?: number;
    result?: Array<{
      name_1?: string;
      latitude: number;
      longitude: number;
      outcode?: string;
      region?: string;
      county_unitary?: string;
    }>;
  };

  const hits = Array.isArray(body.result) ? body.result : [];
  const q = normalize(query);

  const hit =
    hits.find((place) => normalize(place.name_1 ?? "") === q) ??
    hits.find((place) => {
      const name = normalize(place.name_1 ?? "");
      return name.startsWith(q) || q.startsWith(name);
    }) ??
    hits[0];

  if (!hit) return null;

  return {
    lat: hit.latitude,
    lng: hit.longitude,
    label: [hit.name_1, hit.outcode].filter(Boolean).join(", "),
  };
}

async function lookupNominatim(query: string): Promise<GeocodeResult | null> {
  const params = new URLSearchParams({
    q: query,
    format: "json",
    limit: "1",
    countrycodes: "gb",
  });

  const res = await fetch(
    `https://nominatim.openstreetmap.org/search?${params.toString()}`,
    { headers: { Accept: "application/json", "Accept-Language": "en-GB" } },
  );
  if (!res.ok) return null;

  const results = (await res.json()) as Array<{
    lat: string;
    lon: string;
    display_name: string;
  }>;

  const hit = results[0];
  if (!hit) return null;

  return {
    lat: Number(hit.lat),
    lng: Number(hit.lon),
    label: hit.display_name.split(",").slice(0, 2).join(",").trim(),
  };
}

export function haversineMiles(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number,
) {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return EARTH_RADIUS_MILES * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function findNearestBranchWithinRadius(
  branches: SearchBranch[],
  lat: number,
  lng: number,
  radiusMiles = SEARCH_RADIUS_MILES,
) {
  let best: SearchBranch | null = null;
  let bestDistance = Number.POSITIVE_INFINITY;

  for (const branch of branches) {
    const distance = haversineMiles(lat, lng, branch.lat, branch.lng);
    if (distance <= radiusMiles && distance < bestDistance) {
      best = branch;
      bestDistance = distance;
    }
  }

  if (!best) return null;
  return { branch: best, distanceMiles: bestDistance };
}

function resultFromTextMatch(
  match: BranchTextMatch,
  searchedLabel: string,
): Exclude<NearestBranchResult, { error: string }> {
  return {
    branch: match.branch,
    distanceMiles: null,
    searchedLabel,
    via: match.kind === "exact" || match.kind === "strong" ? "name" : "suggest",
    matchKind: match.kind,
  };
}

function resultFromLocalOutcode(
  branches: SearchBranch[],
  parsed: ParsedPostcode,
): Exclude<NearestBranchResult, { error: string }> | null {
  const hit = outcodeIndex[parsed.outcode];
  if (!hit) return null;
  const branch = branchById(branches, hit.branchId);
  if (!branch) return null;
  return {
    branch,
    distanceMiles: hit.miles,
    searchedLabel: parsed.formatted,
    via: "postcode",
  };
}

async function resultFromCoords(
  branches: SearchBranch[],
  coords: GeocodeResult,
  radiusMiles: number,
): Promise<Exclude<NearestBranchResult, { error: string }> | { error: string } | null> {
  const nearest = findNearestBranchWithinRadius(
    branches,
    coords.lat,
    coords.lng,
    radiusMiles,
  );

  if (!nearest) {
    return {
      error: `No Crispies within ${radiusMiles} miles of ${coords.label}. Try another area or postcode.`,
    };
  }

  return {
    branch: nearest.branch,
    distanceMiles: nearest.distanceMiles,
    searchedLabel: coords.label,
    via: "geo",
  };
}

export type NearestBranchResult =
  | {
      branch: SearchBranch;
      distanceMiles: number | null;
      searchedLabel: string;
      via: "geo" | "name" | "suggest" | "postcode";
      matchKind?: BranchMatchKind;
    }
  | { error: string };

export async function resolveNearestBranch(
  query: string,
  branches: SearchBranch[],
  radiusMiles = SEARCH_RADIUS_MILES,
): Promise<NearestBranchResult> {
  const trimmed = query.trim();
  if (!trimmed) {
    return { error: "Enter an area or postcode to search." };
  }

  if (US_ZIP.test(trimmed.replace(/\s+/g, ""))) {
    return {
      error: "Please enter a UK postcode such as W9 2HU, or an area like Kilburn.",
    };
  }

  const parsed = parseUkPostcode(trimmed);
  const textMatch = parsed?.full ? null : findBranchTextMatch(branches, trimmed);

  if (
    textMatch &&
    (textMatch.kind === "exact" ||
      textMatch.kind === "strong" ||
      (textMatch.kind === "fuzzy" && textMatch.score >= 210))
  ) {
    return resultFromTextMatch(textMatch, trimmed);
  }

  if (parsed?.full) {
    const exact = exactPostcodes[parsed.compact];
    if (exact) {
      const branch = branchById(branches, exact.branchId);
      if (branch) {
        return {
          branch,
          distanceMiles: 0,
          searchedLabel: exact.postcode,
          via: "postcode",
        };
      }
    }

    try {
      const coords = await lookupPostcode(parsed.formatted);
      if (coords) {
        const geo = await resultFromCoords(branches, coords, radiusMiles);
        if (geo) return geo;
      }
    } catch {
      /* fall through to the local outcode index */
    }

    const local = resultFromLocalOutcode(branches, parsed);
    if (local) return local;

    if (textMatch) return resultFromTextMatch(textMatch, trimmed);

    return {
      error: `No Crispies within ${radiusMiles} miles of ${parsed.formatted}. Try another area or postcode.`,
    };
  }

  if (parsed && !parsed.full) {
    const local = resultFromLocalOutcode(branches, parsed);
    if (local) return local;

    try {
      const coords = await lookupOutcode(parsed.outcode);
      if (coords) {
        const geo = await resultFromCoords(branches, coords, radiusMiles);
        if (geo) return geo;
      }
    } catch {
      /* ignore */
    }
  }

  try {
    const place = await lookupPlace(trimmed);
    if (place) {
      const geo = await resultFromCoords(branches, place, radiusMiles);
      if (geo && !("error" in geo)) return geo;
      if (textMatch) return resultFromTextMatch(textMatch, trimmed);
      if (geo) return geo;
    }
  } catch {
    /* ignore */
  }

  try {
    const coords = await lookupNominatim(trimmed);
    if (coords) {
      const geo = await resultFromCoords(branches, coords, radiusMiles);
      if (geo && !("error" in geo)) return geo;
      if (textMatch) return resultFromTextMatch(textMatch, trimmed);
      if (geo) return geo;
    }
  } catch {
    /* ignore */
  }

  if (textMatch) {
    return resultFromTextMatch(textMatch, trimmed);
  }

  return {
    error: `No Crispies within ${radiusMiles} miles of that area. Try another town, city, or UK postcode.`,
  };
}
