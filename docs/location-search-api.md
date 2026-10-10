# Branch search and route preview

The server decides which branch a customer gets. The browser only sends the
query or coordinates, shows the result, and draws the route the server returns.

## Pipeline

| Step | Code |
| --- | --- |
| Postcode and outcode recognition | `server/src/utils/uk-postcode.ts` |
| Geocoding (postcodes.io, Nominatim) | `server/src/services/geocoding.service.ts` |
| Ranking, eligibility, name match | `server/src/services/location-ranking.ts` |
| Resolve orchestration | `server/src/services/location-resolution.service.ts` |
| Road route provider (OSRM-compatible) | `server/src/services/routing.service.ts` |
| Route for a chosen branch | `server/src/services/location-route.service.ts` |
| Coverage index (fallback only) | `server/src/data/location-coverage.json` |
| Client API layer | `client/lib/location-resolution.ts` |

## Ranking rules

- Distance is straight-line (Haversine). It is never a road distance.
- Only `status = active` branches with hours are searched. Inactive branches are excluded.
- An open branch beats a Coming Soon branch, even if the Coming Soon one is closer.
- Coming Soon is used only when no open branch is inside the radius. It is never orderable.
- The default radius is 50 miles, set by `LOCATION_RADIUS_MILES`.
- A branch with no coordinates is listed in `unlocatedBranches`. No distance is invented for it.
- Ambiguous text (candidates that lead to different branches) returns `ambiguous`. The customer picks one, and the client sends its coordinates back.

## Coverage index and UUID mapping

`server/src/data/location-coverage.json` maps outward codes to a branch
**slug** (for example `harrow-road`). The database and API use the branch
**UUID**. The old client code compared the two, so it never matched. The
server now maps slug to UUID with `findBranchBySlug`, and the index is only
used when the geocoder is down. Its centre is then ranked against live
coordinates, and the response is marked `approximate`.

## Endpoints

### POST /api/store/locations/resolve

Send exactly one of `query` or `origin`.

```json
{ "query": "W9 2HU" }
```

```json
{ "origin": { "lat": 51.5234, "lng": -0.1963 } }
```

Success (HTTP 200), inside the usual `{ "success": true, "data": ... }` envelope:

| Field | Meaning |
| --- | --- |
| `status` | `found`, `coming_soon`, `ambiguous`, or `not_found` |
| `message` | Customer-safe text, or null |
| `origin` | `{ lat, lng, label, approximate, method }`, or null |
| `branch` | `{ id, name, address, postcode, lat, lng, availability, orderable }`, or null |
| `resolution` | `nearest_branch`, `branch_name`, or null |
| `distance` | `{ value, unit: "miles", type: "straight_line" }`, or null |
| `candidates` | For `ambiguous` only: `[{ label, lat, lng }]` |
| `radiusMiles` | Radius used |
| `unlocatedBranches` | Active branches with no coordinates |

Errors: 400 for invalid input (NaN, Infinity, out of range, both or neither
of `query` and `origin`, empty query). 503 `ERR_UNAVAILABLE` when the
geocoder is down and no local fallback applies. Expected outcomes such as
"no branch nearby" are 200 with `status: "not_found"`, not 500.

### POST /api/store/locations/route

```json
{
  "origin": { "lat": 51.5234, "lng": -0.1963 },
  "destinationLocationId": "<branch UUID>",
  "travelMode": "driving"
}
```

- The destination is read by UUID from the database. The client never sends branch coordinates.
- The branch must be active and not Coming Soon, otherwise 409.
- Success returns `distance` (miles), `distanceKm`, `duration` (minutes), GeoJSON `geometry` ([lng, lat]), `attribution`, and `navigationUrl`.
- 503 `ERR_UNAVAILABLE` when routing is not configured, the provider times out, is rate-limited, or returns bad data. The client then shows the external navigation link. No route is ever drawn from a straight line.
- 404 when the provider finds no driving path.
- Only `driving` is accepted for now.

## Configuration

| Variable | Default | Purpose |
| --- | --- | --- |
| `LOCATION_RADIUS_MILES` | 50 | Search radius, 1 to 200 |
| `LOCATION_GEOCODE_TIMEOUT_MS` | 5000 | Timeout per geocoder request |
| `LOCATION_NOMINATIM_ENABLED` | true | Set `false` to disable Nominatim |
| `LOCATION_NOMINATIM_URL` | OSM public instance | Nominatim base URL |
| `LOCATION_USER_AGENT` | Crispies branch locator | Identifies the site to Nominatim |
| `ROUTING_OSRM_URL` | empty | Routing server base URL. Empty turns in-app routes off |
| `ROUTING_OSRM_PROFILE` | driving | OSRM profile name (some builds use `car`) |
| `ROUTING_TIMEOUT_MS` | 6000 | Timeout per routing request |

Both URLs and all keys are server-only. Nothing uses `NEXT_PUBLIC_*`.

## Provider requirements

- **postcodes.io**: free, no key. Used for postcodes, outcodes, and place names.
- **Nominatim**: public OSM service with a strict usage policy. One request per address search, no retries, UK-only. Keep it for low traffic, or disable it and use a hosted geocoder later.
- **Routing**: no routing server is configured. The public OSRM demo (`router.project-osrm.org`) is for testing only and must not serve production traffic. Use a self-hosted OSRM or a paid OSRM-compatible service, then set `ROUTING_OSRM_URL`. Until then the site shows the navigation link only.

## Privacy

- Customer origins are sent to the geocoder and, if routing is enabled, to the routing provider.
- Coordinates and free-text queries are not logged. Only the failure kind is logged.
- Nothing about the customer's location is stored.
- Responses are `no-store` (POST), so no shared cache holds them.

## Rate limits

- `POST /api/store/locations/resolve`: 60 per 15 minutes per IP.
- `POST /api/store/locations/route`: 60 per 15 minutes per IP.

## Known limits

- Routing is off until a routing server is configured.
- Address suggestions come from the resolve response (ambiguity list), not from a keystroke autocomplete.
- Opening hours are not checked against the clock. Status comes from the existing `hours` field.
- Road distance is only shown when the route comes from the provider.
