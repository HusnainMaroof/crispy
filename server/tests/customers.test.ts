import assert from "node:assert/strict";
import { after, describe, it } from "node:test";
import express from "express";
import "dotenv/config";
import { getPrisma } from "../src/config/prisma.js";
import { authenticate } from "../src/middleware/auth.js";
import customerRoutes from "../src/routes/admin/customers.js";
import { createOrder, customerCanView, getOrderById, getOrdersByCustomerId } from "../src/services/order.service.js";
import { getCustomerForStaff, getOwnProfile, listCustomers, updateOwnProfile } from "../src/services/customer.service.js";
import { customerProfileSchema } from "../src/validators/order.schema.js";
import { NotFoundException } from "../src/utils/app-error.js";
import { FIRST_PAGE } from "./helpers/page.js";

const prisma = getPrisma();
const keys: string[] = [];
const customerIds: string[] = [];
const adminIds: string[] = [];

function key() {
  const value = crypto.randomUUID();
  keys.push(value);
  return value;
}

function customerId() {
  const id = crypto.randomUUID();
  customerIds.push(id);
  return id;
}

async function branch(slug: string) {
  const row = await prisma.locations.findUnique({ where: { slug } });
  assert.ok(row);
  return row;
}

async function place(locationId: string, owner: string, email: string) {
  return createOrder({
    customer_name: "Stage Eleven",
    email,
    phone: "07111000111",
    fulfilment: "collection",
    payment_method: "cash",
    location_id: locationId,
    customer_id: owner,
    checkout_key: key(),
    items: [{ kind: "product", id: "mock-burger-classic", quantity: 1 }],
  });
}

async function manager(locationId: string) {
  const id = crypto.randomUUID();
  adminIds.push(id);
  await prisma.admin_profiles.create({
    data: { id, email: `${id}@stage11.test`, name: "Manager", role: "branch_manager", password_hash: "not-used" },
  });
  await prisma.admin_branch_access.create({ data: { admin_id: id, location_id: locationId } });
  return { sub: id, role: "branch_manager" as const };
}

describe("customers", { concurrency: 1 }, () => {
  it("keeps one customer row across orders and a browser refresh cookie", async () => {
    const owner = customerId();
    const location = await branch("stockwell");
    const first = await place(location.id, owner, "persist@stage11.test");
    const second = await place(location.id, owner, "persist@stage11.test");
    assert.equal(first.customer_id, owner);
    assert.equal(second.customer_id, owner);
    assert.equal(await prisma.customers.count({ where: { id: owner } }), 1);
    const { orders: mine } = await getOrdersByCustomerId(owner, FIRST_PAGE);
    assert.equal(mine.filter((order) => order.id === first.id || order.id === second.id).length, 2);
  });

  it("still checks out a guest without an account", async () => {
    const owner = customerId();
    const location = await branch("edgware-road");
    const order = await place(location.id, owner, "guest@stage11.test");
    assert.equal(order.status, "pending");
    assert.equal(order.customer_id, owner);
    const profile = await getOwnProfile(owner);
    assert.equal(profile.name, "Stage Eleven");
  });

  it("returns only the owner's orders and rejects another customer's order", async () => {
    const owner = customerId();
    const other = customerId();
    const location = await branch("kilburn");
    const order = await place(location.id, owner, "owner@stage11.test");
    await place(location.id, other, "other@stage11.test");
    const { orders: mine } = await getOrdersByCustomerId(owner, FIRST_PAGE);
    assert.ok(mine.some((row) => row.id === order.id));
    assert.equal(mine.some((row) => row.customer_id === other), false);
    assert.equal(customerCanView(order.customer_id, owner), true);
    assert.equal(customerCanView(order.customer_id, other), false);
  });

  it("reads and updates only the profile for the supplied customer id", async () => {
    const owner = customerId();
    const other = customerId();
    await updateOwnProfile(owner, { name: "Ada", email: "ada@stage11.test", phone: "07111000222" });
    await updateOwnProfile(other, { name: "Bea", email: "bea@stage11.test", phone: "07111000333" });
    const parsed = customerProfileSchema.parse({ name: "Ada", customer_id: other });
    assert.equal("customer_id" in parsed, false);
    assert.equal((await getOwnProfile(owner)).name, "Ada");
    assert.equal((await getOwnProfile(other)).email, "bea@stage11.test");
    await updateOwnProfile(owner, { phone: "07111000444" });
    assert.equal((await getOwnProfile(owner)).phone, "07111000444");
    assert.equal((await getOwnProfile(other)).phone, "07111000333");
  });

  it("shows an admin every branch and a manager only their branch", async () => {
    const owner = customerId();
    const email = `split-${owner}@stage11.test`;
    const harrow = await branch("harrow-road");
    const tower = await branch("tower-hill");
    const harrowOrder = await place(harrow.id, owner, email);
    const towerOrder = await place(tower.id, owner, email);
    const admin = { sub: "admin", role: "superadmin" as const };
    const harrowManager = await manager(harrow.id);
    const towerManager = await manager(tower.id);

    const adminView = await getCustomerForStaff(admin, owner);
    assert.equal(adminView.order_count, 2);
    const { customers: found } = await listCustomers(admin, { q: email, ...FIRST_PAGE });
    assert.equal(found.length, 1);
    assert.equal(found[0].order_count, 2);

    const local = await getCustomerForStaff(harrowManager, owner);
    assert.equal(local.order_count, 1);
    assert.deepEqual(local.orders.map((order) => order.id), [harrowOrder.id]);
    assert.equal(local.orders.some((order) => order.id === towerOrder.id), false);

    const { customers: hidden } = await listCustomers(towerManager, { q: email, ...FIRST_PAGE });
    assert.equal(hidden.length, 1);
    assert.equal(hidden[0].order_count, 1);
    assert.equal(hidden[0].latest_order?.id, towerOrder.id);

    const kilburn = await branch("kilburn");
    const outsider = await manager(kilburn.id);
    assert.equal((await listCustomers(outsider, { q: email, ...FIRST_PAGE })).customers.length, 0);
    await assert.rejects(() => getCustomerForStaff(outsider, owner), NotFoundException);
  });

  it("leaves the stored order unchanged when the profile changes", async () => {
    const owner = customerId();
    const location = await branch("harrow");
    const order = await place(location.id, owner, "history@stage11.test");
    const price = Number(order.items[0].price);
    await updateOwnProfile(owner, { name: "Renamed Guest" });
    const detail = await getOrderById(order.id);
    assert.equal(detail.order.customer_name, "Stage Eleven");
    assert.equal(Number(detail.items[0].price), price);
    assert.equal(detail.items[0].name, order.items[0].name);
  });

  it("rejects the CRM list without a staff token", async () => {
    const app = express();
    app.use("/api/admin/customers", authenticate, customerRoutes);
    const server = app.listen(0);
    const address = server.address();
    const port = typeof address === "object" && address ? address.port : 0;
    try {
      const res = await fetch(`http://127.0.0.1:${port}/api/admin/customers`);
      assert.equal(res.status, 401);
      const body = await res.json() as { code?: string };
      assert.equal(body.code, "ERR_UNAUTHORIZED");
    } finally {
      await new Promise<void>((resolve) => server.close(() => resolve()));
    }
  });
});

after(async () => {
  if (keys.length) await prisma.orders.deleteMany({ where: { checkout_key: { in: keys } } });
  if (customerIds.length) await prisma.customers.deleteMany({ where: { id: { in: customerIds } } });
  if (adminIds.length) await prisma.admin_profiles.deleteMany({ where: { id: { in: adminIds } } });
  await prisma.$disconnect();
});
