import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  createLatestGate,
  describeGeolocationError,
  formatMiles,
  navigationLink,
} from "./location-resolution";

describe("navigation link", () => {
  it("builds a driving directions link from validated numbers", () => {
    const url = navigationLink({ lat: 51.5234, lng: -0.1963 }, { lat: 51.5442, lng: -0.2003 });
    assert.equal(url.startsWith("https://www.google.com/maps/dir/?"), true);
    assert.match(url, /origin=51\.5234%2C-0\.1963/);
    assert.match(url, /destination=51\.5442%2C-0\.2003/);
    assert.match(url, /travelmode=driving/);
  });

  it("omits the origin when no start point is known", () => {
    const url = navigationLink(null, { lat: 51.5, lng: -0.1 });
    assert.doesNotMatch(url, /origin=/);
    assert.match(url, /destination=51\.5%2C-0\.1/);
  });
});

describe("user-facing copy", () => {
  it("explains each geolocation failure without inventing a location", () => {
    assert.match(describeGeolocationError(1), /permission was denied/);
    assert.match(describeGeolocationError(2), /could not be found/);
    assert.match(describeGeolocationError(3), /took too long/);
    assert.match(describeGeolocationError(99), /not available/);
  });

  it("formats distances to one decimal place with a unit", () => {
    assert.equal(formatMiles(2.345), "2.3 miles");
    assert.equal(formatMiles(0), "0.0 miles");
  });
});

describe("stale response gate", () => {
  it("accepts the newest lookup and rejects earlier ones", () => {
    const gate = createLatestGate();
    const first = gate.next();
    const second = gate.next();
    assert.equal(first.isCurrent(), false);
    assert.equal(second.isCurrent(), true);
  });

  it("invalidates every pending lookup on cancel (for example on unmount)", () => {
    const gate = createLatestGate();
    const pending = gate.next();
    gate.cancel();
    assert.equal(pending.isCurrent(), false);
  });
});
