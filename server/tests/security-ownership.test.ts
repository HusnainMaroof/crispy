import assert from "node:assert/strict";
import { after, describe, it } from "node:test";
import "dotenv/config";
import { getPrisma } from "../src/config/prisma.js";
import { createOrder, getOwnedOrderById } from "../src/services/order.service.js";
import { ConflictException, NotFoundException } from "../src/utils/app-error.js";

const prisma = getPrisma();
const keys: string[] = [];
const OWNER = "security-customer-owner";
const OTHER = "security-customer-other";

function key() {
  const value = crypto.randomUUID();
  keys.push(value);
  return value;
}

async function placeFor(customerId: string, checkoutKey: string) {
  const location = await prisma.locations.findUnique({ where: { slug: "harrow-road" } });
  assert.ok(location, "harrow-road branch must exist for this test");
  return createOrder({
    customer_name: "Security Test",
    email: "security@example.com",
    phone: "07123456789",
    fulfilment: "collection",
    payment_method: "cash",
    location_id: location.id,
    customer_id: customerId,
    checkout_key: checkoutKey,
    items: [{ kind: "product", id: "mock-burger-crispy", quantity: 1 }],
  });
}

describe("checkout key ownership", { concurrency: 1 }, () => {
  it("returns the same order when the owner retries the same checkout key", async () => {
    const checkoutKey = key();
    const first = await placeFor(OWNER, checkoutKey);
    const retry = await placeFor(OWNER, checkoutKey);
    assert.equal(retry.id, first.id);
  });

  it("refuses another customer's checkout key instead of returning the order", async () => {
    const checkoutKey = key();
    const owned = await placeFor(OWNER, checkoutKey);
    await assert.rejects(() => placeFor(OTHER, checkoutKey), ConflictException);
    // The original order is untouched by the rejected attempt.
    const row = await prisma.orders.findUnique({ where: { id: owned.id } });
    assert.equal(row?.customer_id, OWNER);
  });
});

describe("order detail ownership", { concurrency: 1 }, () => {
  it("returns the order to its owner", async () => {
    const order = await placeFor(OWNER, key());
    const detail = await getOwnedOrderById(order.id, OWNER);
    assert.equal(String(detail.order.id), String(order.id));
    assert.equal(detail.items.length, 1);
  });

  it("answers another customer with not-found, the same as a missing id", async () => {
    const order = await placeFor(OWNER, key());
    await assert.rejects(() => getOwnedOrderById(order.id, OTHER), NotFoundException);
    await assert.rejects(() => getOwnedOrderById(999999999, OWNER), NotFoundException);
  });
});

after(async () => {
  if (keys.length) await prisma.orders.deleteMany({ where: { checkout_key: { in: keys } } });
  await prisma.customers.deleteMany({ where: { id: { in: [OWNER, OTHER] } } });
  await prisma.$disconnect();
});
