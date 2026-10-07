import assert from "node:assert/strict";
import { describe, it, after } from "node:test";
import "dotenv/config";
import { getPrisma, getReadPrisma } from "../src/config/prisma.js";
import { getLocations } from "../src/services/admin.service.js";
import { LruCache, setCacheBackend } from "../src/utils/cache.js";
import { quoteCart } from "../src/services/quote.service.js";
import { NotFoundException } from "../src/utils/app-error.js";

/**
 * Point NEON_READ_REPLICA_URL at a SECOND database with the same schema (for
 * example a scratch database next to the development one) to run the routing
 * assertions. Without it the replica-specific assertions are skipped; the
 * default-branch assertions still run.
 *
 * The two databases hold the same migrated rows, so the test differentiates
 * them with a marker branch written to the primary only: anything routed to
 * the replica cannot see it.
 */
const replicaUrl = process.env.TEST_READ_REPLICA_URL;
const MARKER_SLUG = "perf-routing-marker";

describe("read replica routing", () => {
  after(async () => {
    delete process.env.NEON_READ_REPLICA_URL;
    await getPrisma().locations.deleteMany({ where: { slug: MARKER_SLUG } });
  });

  it("uses the primary for everything when no replica is configured", () => {
    delete process.env.NEON_READ_REPLICA_URL;
    assert.equal(getReadPrisma(), getPrisma());
  });

  it("routes public reads to the replica and admin reads to the primary", async (t) => {
    if (!replicaUrl) {
      t.skip("TEST_READ_REPLICA_URL is not set");
      return;
    }
    process.env.NEON_READ_REPLICA_URL = replicaUrl;

    const primary = getPrisma();
    const replica = getReadPrisma();
    assert.notEqual(replica, primary, "a configured replica is a separate client");

    await primary.locations.create({
      data: {
        id: "perf-routing-marker",
        name: "Perf Routing Marker",
        slug: MARKER_SLUG,
        address: "1 Test Street, London",
        postcode: "W9 2HU",
        city: "London",
        hours: "Every day · 11:00 AM – 11:00 PM",
        phone: "",
        status: "active",
      },
    });

    // Public store read: allowed on the replica, which cannot see the marker.
    const viaReplica = await getLocations({ read: true });
    assert.equal(
      viaReplica.some((location) => location.slug === MARKER_SLUG),
      false,
      "public reads must be served by the replica",
    );

    // Admin and default reads stay on the primary, which has the marker.
    const viaPrimary = await getLocations();
    assert.equal(
      viaPrimary.some((location) => location.slug === MARKER_SLUG),
      true,
      "admin reads must be served by the primary",
    );

    delete process.env.NEON_READ_REPLICA_URL;
  });

  it("fills the public cache from the primary, not the replica", async (t) => {
    if (!replicaUrl) {
      t.skip("TEST_READ_REPLICA_URL is not set");
      return;
    }
    process.env.NEON_READ_REPLICA_URL = replicaUrl;
    setCacheBackend(new LruCache());

    await getPrisma().locations.upsert({
      where: { id: "perf-routing-marker" },
      create: {
        id: "perf-routing-marker",
        name: "Perf Routing Marker",
        slug: MARKER_SLUG,
        address: "1 Test Street, London",
        postcode: "W9 2HU",
        city: "London",
        hours: "Every day · 11:00 AM – 11:00 PM",
        phone: "",
        status: "active",
      },
      update: { status: "active", slug: MARKER_SLUG },
    });

    const filled = await getLocations({ read: true, cache: true, activeOnly: true });
    assert.equal(
      filled.some((location) => location.slug === MARKER_SLUG),
      true,
      "a cache fill must read the primary, which has the marker",
    );

    const viaReplica = await getLocations({ read: true, activeOnly: true });
    assert.equal(
      viaReplica.some((location) => location.slug === MARKER_SLUG),
      false,
      "an uncached public read still uses the replica",
    );

    setCacheBackend(null);
    delete process.env.NEON_READ_REPLICA_URL;
  });

  it("keeps read-your-writes and pricing paths on the primary", async (t) => {
    if (!replicaUrl) {
      t.skip("TEST_READ_REPLICA_URL is not set");
      return;
    }
    process.env.NEON_READ_REPLICA_URL = replicaUrl;

    // quoteCart powers POST /api/menu/quote and the checkout re-pricing. It
    // never passes the read flag, so it must resolve the marker branch that
    // exists only on the primary. Routed to the replica it would 404.
    await getPrisma().branch_menu_items.upsert({
      where: {
        location_id_menu_item_id: { location_id: "perf-routing-marker", menu_item_id: "mock-burger-crispy" },
      },
      create: { location_id: "perf-routing-marker", menu_item_id: "mock-burger-crispy", price: 7.77, available: true },
      update: { price: 7.77, available: true },
    });

    const quote = await quoteCart("perf-routing-marker", [
      { kind: "product", id: "mock-burger-crispy", quantity: 1 },
    ]);
    assert.equal(quote.items[0].unitPrice, 7.77, "pricing reads the primary");

    // Sanity: the same call against the replica directly cannot see the branch.
    await assert.rejects(
      () => getReadPrisma().locations.findUnique({ where: { id: "perf-routing-marker" } }).then((row) => {
        if (!row) throw new NotFoundException("Location not found");
      }),
      NotFoundException,
    );

    delete process.env.NEON_READ_REPLICA_URL;
  });
});
