import assert from "node:assert/strict";
import { afterEach, describe, it } from "node:test";
import "dotenv/config";
import { envConfig } from "../src/config/env.js";
import { geocoder } from "../src/services/geocoding.service.js";
import { createOsrmProvider, requestRoadRoute, ROUTE_FAILED_MESSAGE, ROUTE_UNCONFIGURED_MESSAGE, toRouteUnits } from "../src/services/routing.service.js";
import { navigationUrl } from "../src/services/location-route.service.js";
import { locationRouteSchema } from "../src/validators/location.schema.js";
import { ServiceUnavailableException } from "../src/utils/app-error.js";
import { UpstreamError, getJson } from "../src/utils/upstream-json.js";

const realFetch = globalThis.fetch;

type Handler = (url: string) => Response | Promise<Response>;

function mockFetch(handler: Handler, calls?: string[]) {
  globalThis.fetch = (async (input: string | URL | Request) => {
    const url = String(input);
    calls?.push(url);
    return handler(url);
  }) as typeof fetch;
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });
}

function timeoutError() {
  const error = new Error("The operation timed out");
  error.name = "TimeoutError";
  return error;
}

afterEach(() => {
  globalThis.fetch = realFetch;
  envConfig.LOCATION.NOMINATIM_ENABLED = true;
});

describe("upstream JSON helper", () => {
  it("maps a fetch timeout to an UpstreamError of kind timeout", async () => {
    globalThis.fetch = (async () => { throw timeoutError(); }) as typeof fetch;
    await assert.rejects(getJson("https://example.test/x", { timeoutMs: 500 }), (error: unknown) =>
      error instanceof UpstreamError && error.kind === "timeout");
  });

  it("maps 429 to rate_limited and 5xx to http", async () => {
    mockFetch(() => new Response("", { status: 429 }));
    await assert.rejects(getJson("https://example.test/x", { timeoutMs: 500 }), (e: unknown) =>
      e instanceof UpstreamError && e.kind === "rate_limited");
    mockFetch(() => new Response("", { status: 503 }));
    await assert.rejects(getJson("https://example.test/x", { timeoutMs: 500 }), (e: unknown) =>
      e instanceof UpstreamError && e.kind === "http");
  });

  it("returns status 404 with a null body instead of throwing", async () => {
    mockFetch(() => new Response("", { status: 404 }));
    const result = await getJson("https://example.test/x", { timeoutMs: 500 });
    assert.deepEqual(result, { status: 404, body: null });
  });

  it("maps a non-JSON body to invalid", async () => {
    mockFetch(() => new Response("<html>", { status: 200 }));
    await assert.rejects(getJson("https://example.test/x", { timeoutMs: 500 }), (e: unknown) =>
      e instanceof UpstreamError && e.kind === "invalid");
  });
});

describe("geocoding provider (postcodes.io and Nominatim)", () => {
  it("returns null for a postcode the provider does not know", async () => {
    mockFetch(() => new Response("", { status: 404 }));
    assert.equal(await geocoder.postcode("AB1 1AA"), null);
  });

  it("returns coordinates for a known postcode", async () => {
    const calls: string[] = [];
    mockFetch(() => json({ status: 200, result: { postcode: "CD2 2CD", latitude: 51.52, longitude: -0.19 } }), calls);
    const hit = await geocoder.postcode("CD2 2CD");
    assert.deepEqual(hit, { lat: 51.52, lng: -0.19, label: "CD2 2CD" });
    assert.match(calls[0]!, /postcodes\.io\/postcodes\/CD2%202CD$/);
  });

  it("throws UpstreamError for a 5xx from the postcode provider", async () => {
    mockFetch(() => new Response("", { status: 500 }));
    await assert.rejects(geocoder.postcode("EF3 3EF"), (e: unknown) => e instanceof UpstreamError && e.kind === "http");
  });

  it("rejects a postcode response with a bad shape instead of trusting it", async () => {
    mockFetch(() => json({ status: 200, result: { postcode: "GH4 4GH", latitude: "bad", longitude: 0 } }));
    await assert.rejects(geocoder.postcode("GH4 4GH"), (e: unknown) => e instanceof UpstreamError && e.kind === "invalid");
  });

  it("maps a provider timeout to UpstreamError timeout", async () => {
    globalThis.fetch = (async () => { throw timeoutError(); }) as typeof fetch;
    await assert.rejects(geocoder.places("Maida Vale"), (e: unknown) => e instanceof UpstreamError && e.kind === "timeout");
  });

  it("returns an empty list when places has no result", async () => {
    mockFetch(() => json({ result: null }));
    assert.deepEqual(await geocoder.places("Nowhere Special"), []);
  });

  it("skips Nominatim entirely when it is disabled", async () => {
    envConfig.LOCATION.NOMINATIM_ENABLED = false;
    const calls: string[] = [];
    mockFetch(() => json([]), calls);
    assert.deepEqual(await geocoder.address("1 Test Road"), []);
    assert.equal(calls.length, 0);
  });

  it("sends a User-Agent and limits Nominatim to the UK", async () => {
    let seenUrl = "";
    let seenAgent = "";
    globalThis.fetch = (async (input: string | URL | Request, init?: RequestInit) => {
      seenUrl = String(input);
      seenAgent = new Headers(init?.headers).get("User-Agent") ?? "";
      return json([{ lat: "51.5", lon: "-0.1", display_name: "1 Test Road, London, England, UK" }]);
    }) as typeof fetch;
    const results = await geocoder.address("1 Test Road, London");
    assert.match(seenUrl, /countrycodes=gb/);
    assert.ok(seenAgent.length > 0);
    assert.equal(results[0]?.lat, 51.5);
  });

  it("drops Nominatim hits with non-numeric coordinates", async () => {
    mockFetch(() => json([
      { lat: "abc", lon: "-0.1", display_name: "bad" },
      { lat: "51.5", lon: "-0.1", display_name: "good, London" },
    ]));
    const results = await geocoder.address("road");
    assert.equal(results.length, 1);
    assert.equal(results[0]?.label, "good, London");
  });
});

describe("routing adapter (OSRM-compatible)", () => {
  const origin = { lat: 51.5234, lng: -0.1963 };
  const destination = { lat: 51.5442, lng: -0.2003 };

  it("returns a real road route with GeoJSON coordinates", async () => {
    const calls: string[] = [];
    mockFetch(() => json({
      code: "Ok",
      routes: [{
        distance: 1609.344,
        duration: 600,
        geometry: { type: "LineString", coordinates: [[-0.1963, 51.5234], [-0.2003, 51.5442]] },
      }],
    }), calls);
    const provider = createOsrmProvider("https://routing.example.test", "driving", 2000);
    const route = await provider.route(origin, destination, "driving");
    assert.ok(route);
    assert.equal(route.coordinates.length, 2);
    assert.match(calls[0]!, /\/route\/v1\/driving\/-0\.1963,51\.5234;-0\.2003,51\.5442\?/);
  });

  it("converts meters and seconds to miles and minutes", async () => {
    mockFetch(() => json({
      code: "Ok",
      routes: [{ distance: 1609.344, duration: 600, geometry: { type: "LineString", coordinates: [[0, 0], [1, 1]] } }],
    }));
    const route = await createOsrmProvider("https://r.test", "driving", 2000).route(origin, destination, "driving");
    assert.ok(route);
    const units = toRouteUnits(route);
    assert.deepEqual(units.distance, { value: 1, unit: "miles" });
    assert.deepEqual(units.duration, { value: 10, unit: "minutes" });
  });

  it("returns null when the router reports no route, so no route is fabricated", async () => {
    mockFetch(() => json({ code: "NoRoute", message: "Impossible route" }));
    const route = await createOsrmProvider("https://r.test", "driving", 2000).route(origin, destination, "driving");
    assert.equal(route, null);
  });

  it("rejects malformed geometry instead of drawing it", async () => {
    mockFetch(() => json({
      code: "Ok",
      routes: [{ distance: 1, duration: 1, geometry: { type: "LineString", coordinates: [[0, 0]] } }],
    }));
    await assert.rejects(createOsrmProvider("https://r.test", "driving", 2000).route(origin, destination, "driving"),
      (e: unknown) => e instanceof UpstreamError && e.kind === "invalid");
  });

  it("rejects geometry with out-of-range coordinates", async () => {
    mockFetch(() => json({
      code: "Ok",
      routes: [{ distance: 1, duration: 1, geometry: { type: "LineString", coordinates: [[0, 0], [400, 1]] } }],
    }));
    await assert.rejects(createOsrmProvider("https://r.test", "driving", 2000).route(origin, destination, "driving"),
      (e: unknown) => e instanceof UpstreamError && e.kind === "invalid");
  });
});

describe("route request: controlled provider errors", () => {
  const origin = { lat: 51.5234, lng: -0.1963 };
  const destination = { lat: 51.5442, lng: -0.2003 };

  it("returns a 503 with the navigation fallback message when routing is not configured", async () => {
    await assert.rejects(requestRoadRoute(null, origin, destination, "driving"), (e: unknown) =>
      e instanceof ServiceUnavailableException && e.message === ROUTE_UNCONFIGURED_MESSAGE);
  });

  it("maps a provider timeout to a 503 and never a fake route", async () => {
    const provider = { name: "test", route: async () => { throw new UpstreamError("timeout", "slow"); } };
    await assert.rejects(requestRoadRoute(provider, origin, destination, "driving"), (e: unknown) =>
      e instanceof ServiceUnavailableException && e.message === ROUTE_FAILED_MESSAGE);
  });

  it("maps a provider rate limit to a 503", async () => {
    mockFetch(() => new Response("", { status: 429 }));
    const provider = createOsrmProvider("https://r.test", "driving", 2000);
    await assert.rejects(requestRoadRoute(provider, origin, destination, "driving"), ServiceUnavailableException);
  });

  it("maps a provider 5xx to a 503", async () => {
    mockFetch(() => new Response("", { status: 502 }));
    const provider = createOsrmProvider("https://r.test", "driving", 2000);
    await assert.rejects(requestRoadRoute(provider, origin, destination, "driving"), ServiceUnavailableException);
  });

  it("returns null (not a route) when the provider has no path", async () => {
    mockFetch(() => json({ code: "NoRoute" }));
    const provider = createOsrmProvider("https://r.test", "driving", 2000);
    assert.equal(await requestRoadRoute(provider, origin, destination, "driving"), null);
  });
});

describe("navigation fallback and request contract", () => {
  it("builds the external navigation link only from validated numbers", () => {
    const url = navigationUrl({ lat: 51.5234, lng: -0.1963 }, { lat: 51.5442, lng: -0.2003 }, "driving");
    assert.equal(url.startsWith("https://www.google.com/maps/dir/?"), true);
    assert.match(url, /origin=51\.5234%2C-0\.1963/);
    assert.match(url, /destination=51\.5442%2C-0\.2003/);
    assert.match(url, /travelmode=driving/);
    assert.doesNotMatch(url, /key=/i);
  });

  it("accepts driving and rejects unsupported travel modes", () => {
    const base = { origin: { lat: 51.5, lng: -0.1 }, destinationLocationId: "abc" };
    const ok = locationRouteSchema.safeParse(base);
    assert.equal(ok.success, true);
    assert.equal(ok.success && ok.data.travelMode, "driving");
    assert.equal(locationRouteSchema.safeParse({ ...base, travelMode: "walking" }).success, false);
    assert.equal(locationRouteSchema.safeParse({ ...base, destinationLocationId: "" }).success, false);
    assert.equal(locationRouteSchema.safeParse({ ...base, origin: { lat: Number.NaN, lng: 0 } }).success, false);
  });
});
