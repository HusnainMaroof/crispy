import assert from "node:assert/strict";
import { after, describe, it } from "node:test";
import "dotenv/config";
import { getPrisma } from "../src/config/prisma.js";
import {
  assertOrderAccess,
  assertStatusTransition,
  createOrder,
  customerCanView,
  getOrderById,
  getOrders,
  nextStatuses,
  updateOrderStatus,
} from "../src/services/order.service.js";
import { BadRequestException, ConflictException, ForbiddenException } from "../src/utils/app-error.js";

const prisma = getPrisma();
const keys: string[] = [];
const adminIds: string[] = [];

function key() {
  const value = crypto.randomUUID();
  keys.push(value);
  return value;
}

async function branch(slug: string) {
  const row = await prisma.locations.findUnique({ where: { slug } });
  assert.ok(row);
  return row;
}

async function place(slug: string, fulfilment: "collection" | "delivery" = "collection") {
  const location = await branch(slug);
  return createOrder({
    customer_name: "Stage Ten",
    email: "stage10@example.com",
    phone: "07123456789",
    address: fulfilment === "delivery" ? "1 Test Street" : null,
    postcode: fulfilment === "delivery" ? "W1 1AA" : null,
    city: fulfilment === "delivery" ? "London" : null,
    notes: "no onion",
    fulfilment,
    payment_method: "cash",
    location_id: location.id,
    customer_id: "customer-a",
    checkout_key: key(),
    items: [{ kind: "product", id: "mock-burger-crispy", quantity: 1 }],
  });
}

async function manager(locationId: string) {
  const id = crypto.randomUUID();
  adminIds.push(id);
  await prisma.admin_profiles.create({
    data: {
      id,
      email: `${id}@stage10.test`,
      name: "Branch manager",
      role: "branch_manager",
      password_hash: "not-used",
    },
  });
  await prisma.admin_branch_access.create({ data: { admin_id: id, location_id: locationId } });
  return { sub: id, role: "branch_manager" as const };
}

describe("order management", { concurrency: 1 }, () => {
  it("lists an order from stored snapshots", async () => {
    const order = await place("harrow-road");
    const listed = await getOrders({ location_id: order.location_id ?? undefined });
    const row = listed.find((entry) => entry.id === order.id);
    assert.ok(row);
    assert.equal(row.location_name, "Harrow Road");
    assert.equal(row.customer_name, "Stage Ten");
    assert.equal(row.fulfilment, "collection");
    assert.equal(row.status, "pending");
    assert.equal(Number(row.total), Number(row.items[0].price));
    assert.equal(row.items[0].name, "Crispy Chicken Burger");
  });

  it("returns order detail from the snapshot", async () => {
    const order = await place("harrow-road", "delivery");
    const detail = await getOrderById(order.id);
    assert.equal(detail.order.location_name, "Harrow Road");
    assert.equal(detail.order.payment_method, "cash");
    assert.equal(detail.order.notes, "no onion");
    assert.equal(detail.order.address, "1 Test Street");
    assert.equal(Number(detail.order.delivery_fee), 0);
    assert.equal(Number(detail.order.subtotal), Number(detail.items[0].price));
    assert.equal(Number(detail.order.total), Number(detail.items[0].price) * detail.items[0].quantity);
    assert.equal(detail.items[0].quantity, 1);
  });

  it("lets the super admin and the assigned manager read the order, and rejects another branch", async () => {
    const harrow = await branch("harrow-road");
    const tower = await branch("tower-hill");
    const order = await place("harrow-road");
    const local = await manager(harrow.id);
    const other = await manager(tower.id);
    const admin = { sub: "admin", role: "superadmin" as const };

    await assertOrderAccess(admin, order.location_id);
    await assertOrderAccess(local, order.location_id);
    await assert.rejects(() => assertOrderAccess(other, order.location_id), ForbiddenException);

    const visible = await getOrders({ location_ids: [harrow.id] });
    assert.ok(visible.some((entry) => entry.id === order.id));
    const hidden = await getOrders({ location_ids: [tower.id] });
    assert.equal(hidden.some((entry) => entry.id === order.id), false);

    await assert.rejects(
      () => updateOrderStatus(order.id, "preparing", other),
      ForbiddenException,
    );
    const unchanged = await getOrderById(order.id);
    assert.equal(unchanged.order.status, "pending");
  });

  it("rejects pending to delivered and persists a valid transition", async () => {
    const order = await place("stockwell");
    const admin = { sub: "admin", role: "superadmin" as const };
    await assert.rejects(() => updateOrderStatus(order.id, "delivered", admin), BadRequestException);
    assert.equal((await getOrderById(order.id)).order.status, "pending");
    const updated = await updateOrderStatus(order.id, "preparing", admin);
    assert.equal(updated.status, "preparing");
    assert.equal((await getOrderById(order.id)).order.status, "preparing");
  });

  it("uses collection and delivery workflows", () => {
    assert.deepEqual(nextStatuses("collection", "ready"), ["delivered", "cancelled"]);
    assert.deepEqual(nextStatuses("delivery", "ready"), ["out-for-delivery", "cancelled"]);
    assert.doesNotThrow(() => assertStatusTransition("collection", "ready", "delivered"));
    assert.throws(() => assertStatusTransition("collection", "ready", "out-for-delivery"), BadRequestException);
    assert.doesNotThrow(() => assertStatusTransition("delivery", "ready", "out-for-delivery"));
    assert.throws(() => assertStatusTransition("delivery", "ready", "delivered"), BadRequestException);
    assert.throws(() => assertStatusTransition("delivery", "out-for-delivery", "cancelled"), BadRequestException);
    assert.throws(() => assertStatusTransition("collection", "delivered", "cancelled"), BadRequestException);
  });

  it("walks a collection order to delivered and a delivery order through dispatch", async () => {
    const admin = { sub: "admin", role: "superadmin" as const };
    const collection = await place("edgware-road", "collection");
    await updateOrderStatus(collection.id, "preparing", admin);
    await updateOrderStatus(collection.id, "ready", admin);
    await assert.rejects(() => updateOrderStatus(collection.id, "out-for-delivery", admin), BadRequestException);
    await updateOrderStatus(collection.id, "delivered", admin);
    assert.equal((await getOrderById(collection.id)).order.status, "delivered");

    const delivery = await place("wembley-central", "delivery");
    await updateOrderStatus(delivery.id, "preparing", admin);
    await updateOrderStatus(delivery.id, "ready", admin);
    await assert.rejects(() => updateOrderStatus(delivery.id, "delivered", admin), BadRequestException);
    await updateOrderStatus(delivery.id, "out-for-delivery", admin);
    await updateOrderStatus(delivery.id, "delivered", admin);
    assert.equal((await getOrderById(delivery.id)).order.status, "delivered");
  });

  it("cancels only before an order leaves the branch", async () => {
    const admin = { sub: "admin", role: "superadmin" as const };
    const early = await place("harrow");
    await updateOrderStatus(early.id, "cancelled", admin);
    assert.equal((await getOrderById(early.id)).order.status, "cancelled");
    await assert.rejects(() => updateOrderStatus(early.id, "preparing", admin), BadRequestException);

    const dispatched = await place("kilburn", "delivery");
    await updateOrderStatus(dispatched.id, "preparing", admin);
    await updateOrderStatus(dispatched.id, "ready", admin);
    await updateOrderStatus(dispatched.id, "out-for-delivery", admin);
    await assert.rejects(() => updateOrderStatus(dispatched.id, "cancelled", admin), BadRequestException);
    assert.equal((await getOrderById(dispatched.id)).order.status, "out-for-delivery");
  });

  it("shows an order only to the customer who owns it", () => {
    assert.equal(customerCanView("customer-a", "customer-a"), true);
    assert.equal(customerCanView("customer-a", "customer-b"), false);
    assert.equal(customerCanView(null, "customer-a"), false);
  });

  it("keeps the stored price after the catalogue price changes", async () => {
    const location = await branch("harrow-road");
    await prisma.branch_menu_items.update({
      where: { location_id_menu_item_id: { location_id: location.id, menu_item_id: "mock-burger-crispy" } },
      data: { price: 9.25 },
    });
    const order = await place("harrow-road");
    assert.equal(Number(order.items[0].price), 9.25);
    await prisma.branch_menu_items.update({
      where: { location_id_menu_item_id: { location_id: location.id, menu_item_id: "mock-burger-crispy" } },
      data: { price: 10.25 },
    });
    try {
      const detail = await getOrderById(order.id);
      assert.equal(Number(detail.items[0].price), 9.25);
      assert.equal(Number(detail.order.total), 9.25);
    } finally {
      await prisma.branch_menu_items.update({
        where: { location_id_menu_item_id: { location_id: location.id, menu_item_id: "mock-burger-crispy" } },
        data: { price: 9.25 },
      });
    }
  });

  it("rejects a second status write once the first one has landed", async () => {
    const order = await place("elephant-and-castle");
    const admin = { sub: "admin", role: "superadmin" as const };
    const results = await Promise.allSettled([
      updateOrderStatus(order.id, "preparing", admin),
      updateOrderStatus(order.id, "preparing", admin),
    ]);
    assert.equal(results.filter((result) => result.status === "fulfilled").length, 1);
    const rejected = results.find((result) => result.status === "rejected");
    assert.ok(rejected && rejected.status === "rejected");
    assert.ok(rejected.reason instanceof BadRequestException || rejected.reason instanceof ConflictException);
    assert.equal((await getOrderById(order.id)).order.status, "preparing");
  });
});

after(async () => {
  if (keys.length) await prisma.orders.deleteMany({ where: { checkout_key: { in: keys } } });
  if (adminIds.length) await prisma.admin_profiles.deleteMany({ where: { id: { in: adminIds } } });
  await prisma.$disconnect();
});
