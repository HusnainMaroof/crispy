/**
 * Builds a local UK outcode index within 50 miles of every Crispies branch.
 * Run: node scripts/generate-location-coverage.mjs
 */
import { writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const RADIUS_MILES = 50;
const EARTH_RADIUS_MILES = 3958.8;
const API = "https://api.postcodes.io";

const BRANCHES = [
  {
    id: "harrow-road",
    name: "Harrow Road",
    address: "412 Harrow Road, London W9 2HU",
    postcode: "W9 2HU",
    lat: 51.5259,
    lng: -0.195,
  },
  {
    id: "tower-hill",
    name: "Tower Hill",
    address: "Unit 2, Tower Hill Terrace, London EC3N 4EE",
    postcode: "EC3N 4EE",
    lat: 51.5098,
    lng: -0.0759,
  },
  {
    id: "kilburn",
    name: "Kilburn",
    address: "302 Kilburn High Rd, Kilburn, London NW6 2DB",
    postcode: "NW6 2DB",
    lat: 51.5371,
    lng: -0.192,
  },
  {
    id: "harrow",
    name: "Harrow",
    address: "253 Station Rd, Harrow, London HA1 2TB",
    postcode: "HA1 2TB",
    lat: 51.5793,
    lng: -0.3352,
  },
  {
    id: "elephant-and-castle",
    name: "Elephant & Castle",
    address: "345 Walworth Rd, Elephant & Castle, London SE17 2NA",
    postcode: "SE17 2NA",
    lat: 51.4864,
    lng: -0.0986,
  },
  {
    id: "edgware-road",
    name: "Edgware Road",
    address: "340 Edgware Rd, Westminister, London W2 1EA",
    postcode: "W2 1EA",
    lat: 51.5218,
    lng: -0.167,
  },
  {
    id: "stockwell",
    name: "Stockwell",
    address: "314 Clapham Rd, Lambeth, London SW9 9AE",
    postcode: "SW9 9AE",
    lat: 51.4726,
    lng: -0.118,
  },
  {
    id: "wembley-central",
    name: "Wembley Central",
    address: "421 High Rd, Wembley, London HA9 7AB",
    postcode: "HA9 7AB",
    lat: 51.552,
    lng: -0.2956,
  },
  {
    id: "ruislip",
    name: "Ruislip",
    address: "77 Victoria Road, Ruislip, London HA4 9BH",
    postcode: "HA4 9BH",
    lat: 51.5767,
    lng: -0.4134,
  },
];

function toRad(deg) {
  return (deg * Math.PI) / 180;
}

function haversineMiles(lat1, lng1, lat2, lng2) {
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return EARTH_RADIUS_MILES * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function nearestBranch(lat, lng, branches) {
  let best = null;
  let bestMiles = Number.POSITIVE_INFINITY;
  for (const branch of branches) {
    const miles = haversineMiles(lat, lng, branch.lat, branch.lng);
    if (miles < bestMiles) {
      best = branch;
      bestMiles = miles;
    }
  }
  return { branch: best, miles: bestMiles };
}

async function getJson(url) {
  const res = await fetch(url, { headers: { Accept: "application/json" } });
  if (!res.ok) return null;
  return res.json();
}

async function sleep(ms) {
  await new Promise((r) => setTimeout(r, ms));
}

const branches = [];
for (const branch of BRANCHES) {
  const body = await getJson(
    `${API}/postcodes/${encodeURIComponent(branch.postcode)}`,
  );
  const result = body?.result;
  branches.push({
    ...branch,
    postcode: result?.postcode ?? branch.postcode,
    lat: result?.latitude ?? branch.lat,
    lng: result?.longitude ?? branch.lng,
    outcode: (result?.outcode ?? branch.postcode.split(" ")[0]).toUpperCase(),
  });
  await sleep(80);
}

const outcodes = {};
const queue = [];
const seen = new Set();

function addOutcode(outcode, lat, lng) {
  const key = String(outcode).toUpperCase();
  if (seen.has(key)) return;
  seen.add(key);
  const { branch, miles } = nearestBranch(lat, lng, branches);
  if (!branch || miles > RADIUS_MILES) return;
  outcodes[key] = {
    lat: Number(lat.toFixed(5)),
    lng: Number(lng.toFixed(5)),
    branchId: branch.id,
    miles: Number(miles.toFixed(2)),
  };
  queue.push(key);
}

for (const branch of branches) {
  addOutcode(branch.outcode, branch.lat, branch.lng);
}

while (queue.length) {
  const current = queue.shift();
  const body = await getJson(
    `${API}/outcodes/${encodeURIComponent(current)}/nearest?limit=100&radius=25000`,
  );
  const results = Array.isArray(body?.result) ? body.result : [];
  for (const row of results) {
    if (!row?.outcode) continue;
    addOutcode(row.outcode, row.latitude, row.longitude);
  }
  process.stdout.write(
    `\rIndexed ${Object.keys(outcodes).length} outcodes, queue ${queue.length}   `,
  );
  await sleep(60);
}

const payload = {
  generatedAt: new Date().toISOString(),
  radiusMiles: RADIUS_MILES,
  branches: branches.map((b) => ({
    id: b.id,
    name: b.name,
    address: b.address,
    postcode: b.postcode,
    outcode: b.outcode,
    lat: Number(b.lat.toFixed(6)),
    lng: Number(b.lng.toFixed(6)),
  })),
  postcodes: Object.fromEntries(
    branches.map((b) => [
      b.postcode.replace(/\s+/g, "").toUpperCase(),
      { branchId: b.id, postcode: b.postcode },
    ]),
  ),
  outcodes,
};

const root = dirname(fileURLToPath(import.meta.url));
const outPath = join(root, "..", "lib", "location-coverage.json");
writeFileSync(outPath, `${JSON.stringify(payload)}\n`);
console.log(
  `\nWrote ${Object.keys(outcodes).length} outcodes + ${branches.length} branch postcodes to ${outPath}`,
);
