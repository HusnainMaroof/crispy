import assert from "node:assert/strict";
import { describe, it, after } from "node:test";
import "dotenv/config";
import { Prisma } from "../src/generated/prisma/client.js";
import { getPrisma } from "../src/config/prisma.js";
import { quoteCart, type QuoteRequestLine } from "../src/services/quote.service.js";
import { getDashboardStats } from "../src/services/order.service.js";
import { ItemUnavailableException, NotFoundException } from "../src/utils/app-error.js";

const prisma = getPrisma();
const FIXTURE_PREFIX = "perf-fixture-";

async function idFor(slug: string) {
  const row = await prisma.locations.findUnique({ where: { slug } });
  assert.ok(row);
  return row.id;
}

function money(value: Prisma.Decimal): number {
  return value.toDecimalPlaces(2).toNumber();
}

/**
 * The pre-batching implementation: one findUnique for the catalogue row and one
 * for the branch override, per line, inside a loop. Kept here as the reference
 * so the batched quote must keep matching it exactly.
 */
async function referenceQuote(locationId: string, lines: QuoteRequestLine[]) {
  const location = await prisma.locations.findUnique({ where: { id: locationId } });
  if (!location || location.status !== "active") throw new NotFoundException("Location not found");

  const items = [];
  let subtotal = new Prisma.Decimal(0);
  for (const line of lines) {
    let name: string;
    let amount: Prisma.Decimal;
    if (line.kind === "product") {
      const product = await prisma.menu_items.findUnique({ where: { id: line.id } });
      if (!product) throw new NotFoundException("Menu item not found");
      const branch = await prisma.branch_menu_items.findUnique({
        where: { location_id_menu_item_id: { location_id: location.id, menu_item_id: product.id } },
      });
      if (!product.active || !branch || !branch.available) {
        throw new ItemUnavailableException(`${product.name} is not available at this branch`, {
          kind: "product",
          id: product.id,
        });
      }
      name = product.name;
      amount = new Prisma.Decimal(branch.price ?? product.price);
    } else {
      const deal = await prisma.deals.findUnique({ where: { id: line.id } });
      if (!deal) throw new NotFoundException("Deal not found");
      const branch = await prisma.branch_deals.findUnique({
        where: { location_id_deal_id: { location_id: location.id, deal_id: deal.id } },
      });
      if (!deal.active || !branch || !branch.available) {
        throw new ItemUnavailableException(`${deal.name} is not available at this branch`, {
          kind: "deal",
          id: deal.id,
        });
      }
      name = deal.name;
      amount = new Prisma.Decimal(branch.price ?? deal.price);
    }
    const lineTotal = amount.mul(line.quantity);
    subtotal = subtotal.add(lineTotal);
    items.push({
      kind: line.kind,
      id: line.id,
      name,
      quantity: line.quantity,
      unitPrice: money(amount),
      lineTotal: money(lineTotal),
    });
  }
  const total = money(subtotal);
  return { locationId: location.id, items, subtotal: total, total };
}

describe("batched quote parity", () => {
  it("matches the old per-line implementation on a mixed cart", async () => {
    const harrow = await idFor("harrow-road");
    const kilburn = await idFor("kilburn");
    const lines: QuoteRequestLine[] = [
      { kind: "product", id: "mock-burger-crispy", quantity: 2 },
      { kind: "deal", id: "mock-deal-wings", quantity: 1 },
      { kind: "product", id: "mock-burger-classic", quantity: 3 },
    ];

    // Harrow Road has a price override, Kilburn uses global prices: both paths.
    for (const locationId of [harrow, kilburn]) {
      const batched = await quoteCart(locationId, lines);
      const perLine = await referenceQuote(locationId, lines);
      assert.deepEqual(batched, perLine);
    }
  });

  it("reports the offending line for ERR_ITEM_UNAVAILABLE like before", async () => {
    const tower = await idFor("tower-hill");
    const lines: QuoteRequestLine[] = [
      { kind: "product", id: "mock-burger-crispy", quantity: 1 },
      { kind: "product", id: "mock-burger-spicy", quantity: 2 },
    ];

    for (const quote of [
      () => quoteCart(tower, lines),
      () => referenceQuote(tower, lines),
    ]) {
      await assert.rejects(quote, (error: unknown) => {
        assert.ok(error instanceof ItemUnavailableException);
        assert.equal(error.item.id, "mock-burger-spicy");
        assert.equal(error.item.kind, "product");
        return true;
      });
    }
  });

  it("keeps NotFoundException for a missing catalogue row", async () => {
    const harrow = await idFor("harrow-road");
    await assert.rejects(
      () => quoteCart(harrow, [{ kind: "product", id: "does-not-exist", quantity: 1 }]),
      NotFoundException,
    );
  });
});

describe("dashboard stats parity", () => {
  const fixture = [
    { key: "a", status: "pending", total: 10, created_at: new Date() },
    { key: "b", status: "preparing", total: 20.5, created_at: new Date() },
    { key: "c", status: "delivered", total: 30, created_at: new Date() },
    { key: "d", status: "cancelled", total: 40, created_at: new Date() },
    { key: "e", status: "out-for-delivery", total: 50.25, created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000) },
    { key: "f", status: "ready", total: 60.75, created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000) },
  ];

  after(async () => {
    await prisma.orders.deleteMany({ where: { checkout_key: { startsWith: FIXTURE_PREFIX } } });
  });

  it("SQL aggregates equal the old JS semantics over the same rows", async () => {
    const harrow = await idFor("harrow-road");
    const kilburn = await idFor("kilburn");
    await prisma.orders.deleteMany({ where: { checkout_key: { startsWith: FIXTURE_PREFIX } } });
    await prisma.orders.createMany({
      data: fixture.map((row, index) => ({
        customer_name: "Perf Fixture",
        email: `perf-fixture-${row.key}@example.com`,
        phone: "07123456789",
        fulfilment: "delivery",
        payment_method: "card",
        subtotal: row.total,
        delivery_fee: 0,
        total: row.total,
        status: row.status,
        location_id: index % 2 === 0 ? harrow : kilburn,
        checkout_key: `${FIXTURE_PREFIX}${row.key}`,
        created_at: row.created_at,
        updated_at: row.created_at,
      })),
    });

    // The reference is the old semantics: sum and count in JavaScript with
    // Decimal money, rounded once at the end.
    const startOfToday = new Date();
    startOfToday.setUTCHours(0, 0, 0, 0);

    const reference = async (locationIds: string[] | null) => {
      const rows = await prisma.orders.findMany({
        where: locationIds ? { location_id: { in: locationIds } } : {},
      });
      let revenue = new Prisma.Decimal(0);
      let todayRevenue = new Prisma.Decimal(0);
      let activeOrders = 0;
      const statusCounts: Record<string, number> = {};
      for (const row of rows) {
        revenue = revenue.add(row.total);
        if (row.created_at >= startOfToday) todayRevenue = todayRevenue.add(row.total);
        statusCounts[row.status] = (statusCounts[row.status] ?? 0) + 1;
        if (row.status !== "delivered" && row.status !== "cancelled") activeOrders += 1;
      }
      return {
        total_orders: rows.length,
        active_orders: activeOrders,
        revenue: revenue.toNumber(),
        today_revenue: todayRevenue.toNumber(),
        status_counts: statusCounts,
      };
    };

    const all = await getDashboardStats();
    assert.deepEqual(all, await reference(null));

    const scoped = await getDashboardStats([harrow]);
    assert.deepEqual(scoped, await reference([harrow]));

    // Non-trivial on purpose: the fixture must actually move the numbers.
    assert.ok(all.total_orders >= fixture.length);
    assert.ok(all.revenue >= 211.5);
  });
});
