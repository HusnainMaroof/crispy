import assert from "node:assert/strict";
import { after, describe, it } from "node:test";
import type { Request, Response } from "express";
import "dotenv/config";
import { getPrisma } from "../src/config/prisma.js";
import { OrdersController } from "../src/controllers/admin/orders.controller.js";
import { countOrders, getOrders } from "../src/services/order.service.js";
import { ForbiddenException } from "../src/utils/app-error.js";
import { buildMeta, resolvePage, MAX_PAGE_SIZE } from "../src/utils/pagination.js";

const prisma = getPrisma();
const keys: string[] = [];
const customerIds: string[] = [];
const adminIds: string[] = [];
const token = `branch-filter-${crypto.randomUUID()}`;

function key() {
  const value = crypto.randomUUID();
  keys.push(value);
  return value;
}

async function branch(slug: string) {
  const row = await prisma.locations.findUnique({ where: { slug } });
  assert.ok(row, `missing branch ${slug}`);
  return row;
}

async function manager(locationIds: string[]) {
  const id = crypto.randomUUID();
  adminIds.push(id);
  await prisma.admin_profiles.create({
    data: {
      id,
      email: `${id}@branch-filter.test`,
      name: "Filter Manager",
      role: "branch_manager",
      password_hash: "not-used",
    },
  });
  for (const location_id of locationIds) {
    await prisma.admin_branch_access.create({ data: { admin_id: id, location_id } });
  }
  return { sub: id, role: "branch_manager" as const };
}

async function seedOrder(locationId: string, customer: string, createdAt: Date, extra?: { status?: string; fulfilment?: string }) {
  await prisma.orders.create({
    data: {
      customer_name: token,
      email: `${token}@branch-filter.test`,
      phone: "07111000111",
      fulfilment: extra?.fulfilment ?? "collection",
      payment_method: "cash",
      subtotal: 1,
      delivery_fee: 0,
      total: 1,
      status: extra?.status ?? "pending",
      location_id: locationId,
      customer_id: customer,
      checkout_key: key(),
      created_at: createdAt,
    },
  });
}

type Listed = { location_id: string | null; id: number };

function capture() {
  const sent: { status: number; body: { data: Listed[]; pagination: { total: number; page: number; limit: number; hasNextPage: boolean; hasPreviousPage: boolean } } } = {
    status: 0,
    body: { data: [], pagination: { total: 0, page: 0, limit: 0, hasNextPage: false, hasPreviousPage: false } },
  };
  const res = {
    status(code: number) {
      sent.status = code;
      return this;
    },
    json(body: typeof sent.body) {
      sent.body = body;
      return this;
    },
  };
  return { sent, res: res as unknown as Response };
}

function listRequest(admin: { sub: string; role: string }, query: Record<string, unknown>) {
  return { admin, query } as unknown as Request;
}

describe("admin order branch filter", { concurrency: 1 }, () => {
  it("returns every allowed branch when no branch is requested, and only the requested branch when one is", async () => {
    const a = await branch("harrow-road");
    const b = await branch("tower-hill");
    const c = await branch("kilburn");
    const owner = crypto.randomUUID();
    customerIds.push(owner);
    await prisma.customers.create({ data: { id: owner, name: token } });
    const createdAt = new Date("2026-08-08T00:00:00Z");
    await seedOrder(a.id, owner, createdAt);
    await seedOrder(a.id, owner, createdAt);
    await seedOrder(b.id, owner, createdAt);
    await seedOrder(c.id, owner, createdAt);

    const actor = await manager([a.id, b.id]);

    const open = capture();
    await OrdersController.list(listRequest(actor, { q: token, limit: 100 }), open.res);
    const openIds = open.sent.body.data.map((row) => row.location_id);
    assert.equal(open.sent.body.pagination.total, 3);
    assert.equal(openIds.filter((id) => id === a.id).length, 2);
    assert.equal(openIds.filter((id) => id === b.id).length, 1);
    assert.equal(openIds.includes(c.id), false);

    const onlyA = capture();
    await OrdersController.list(listRequest(actor, { q: token, location_id: a.id, limit: 100 }), onlyA.res);
    assert.equal(onlyA.sent.body.pagination.total, 2);
    assert.equal(onlyA.sent.body.data.every((row) => row.location_id === a.id), true);

    const onlyB = capture();
    await OrdersController.list(listRequest(actor, { q: token, location_id: b.id, limit: 100 }), onlyB.res);
    assert.equal(onlyB.sent.body.pagination.total, 1);
    assert.equal(onlyB.sent.body.data[0]?.location_id, b.id);

    await assert.rejects(
      () => OrdersController.list(listRequest(actor, { q: token, location_id: c.id }), capture().res),
      ForbiddenException,
    );

    const superadmin = capture();
    await OrdersController.list(
      listRequest({ sub: "superadmin", role: "superadmin" }, { q: token, location_id: b.id, limit: 100 }),
      superadmin.res,
    );
    assert.equal(superadmin.sent.body.pagination.total, 1);
    assert.equal(superadmin.sent.body.data[0]?.location_id, b.id);

    const single = await manager([a.id]);
    const singleOpen = capture();
    await OrdersController.list(listRequest(single, { q: token, limit: 100 }), singleOpen.res);
    assert.equal(singleOpen.sent.body.data.every((row) => row.location_id === a.id), true);
    assert.equal(singleOpen.sent.body.pagination.total, 2);
  });

  it("pages a branch-filtered list with the same filters on the count", async () => {
    const a = await branch("stockwell");
    const b = await branch("wembley-central");
    const owner = crypto.randomUUID();
    customerIds.push(owner);
    await prisma.customers.create({ data: { id: owner, name: token } });
    const createdAt = new Date("2026-08-09T00:00:00Z");
    const pageToken = `${token}-page`;
    for (let index = 0; index < 25; index++) {
      await prisma.orders.create({
        data: {
          customer_name: pageToken,
          email: `${pageToken}@branch-filter.test`,
          phone: "07111000111",
          fulfilment: "collection",
          payment_method: "cash",
          subtotal: 1,
          delivery_fee: 0,
          total: 1,
          status: "pending",
          location_id: a.id,
          customer_id: owner,
          checkout_key: key(),
          created_at: createdAt,
        },
      });
    }
    await prisma.orders.create({
      data: {
        customer_name: pageToken,
        email: `${pageToken}@branch-filter.test`,
        phone: "07111000111",
        fulfilment: "collection",
        payment_method: "cash",
        subtotal: 1,
        delivery_fee: 0,
        total: 1,
        status: "delivered",
        location_id: a.id,
        customer_id: owner,
        checkout_key: key(),
        created_at: createdAt,
      },
    });
    await prisma.orders.create({
      data: {
        customer_name: pageToken,
        email: `${pageToken}@branch-filter.test`,
        phone: "07111000111",
        fulfilment: "delivery",
        payment_method: "cash",
        subtotal: 1,
        delivery_fee: 0,
        total: 1,
        status: "pending",
        location_id: a.id,
        customer_id: owner,
        checkout_key: key(),
        created_at: createdAt,
      },
    });
    await prisma.orders.create({
      data: {
        customer_name: pageToken,
        email: `${pageToken}@branch-filter.test`,
        phone: "07111000111",
        fulfilment: "collection",
        payment_method: "cash",
        subtotal: 1,
        delivery_fee: 0,
        total: 1,
        status: "pending",
        location_id: b.id,
        customer_id: owner,
        checkout_key: key(),
        created_at: createdAt,
      },
    });

    const filter = {
      location_id: a.id,
      location_ids: [a.id, b.id],
      status: "pending",
      fulfilment: "collection",
      q: pageToken,
    };

    const walked: number[] = [];
    for (const page of [1, 2, 3]) {
      const request = resolvePage({ page, limit: 10 });
      const [rows, total] = await Promise.all([
        getOrders({ ...filter, ...request }),
        countOrders(filter),
      ]);
      assert.equal(total, 25);
      assert.equal(rows.every((row) => row.location_id === a.id), true);
      assert.equal(rows.every((row) => row.status === "pending" && row.fulfilment === "collection"), true);
      walked.push(...rows.map((row) => row.id));
      const meta = buildMeta(request.page, request.limit, total);
      if (page < 3) assert.equal(meta.hasNextPage, true);
      if (page === 3) {
        assert.equal(rows.length, 5);
        assert.equal(meta.hasNextPage, false);
        assert.equal(meta.hasPreviousPage, true);
      }
    }

    const past = await getOrders({ ...filter, ...resolvePage({ page: 99, limit: 20 }) });
    const pastTotal = await countOrders(filter);
    assert.deepEqual(past, []);
    assert.equal(pastTotal, 25);

    const one = await getOrders({ ...filter, ...resolvePage({ page: 2, limit: 1 }) });
    assert.equal(one.length, 1);
    assert.equal(one[0]?.location_id, a.id);

    const twenty = await getOrders({ ...filter, ...resolvePage({ page: 1, limit: 20 }) });
    const twentyNext = await getOrders({ ...filter, ...resolvePage({ page: 2, limit: 20 }) });
    assert.equal(twenty.length, 20);
    assert.equal(twentyNext.length, 5);

    const capped = await getOrders({ ...filter, ...resolvePage({ page: 1, limit: 100 }) });
    assert.equal(resolvePage({ page: 1, limit: 100 }).limit, 100);
    assert.equal(capped.length, 25);
    assert.equal(await countOrders(filter), 25);

    const huge = await getOrders({ ...filter, ...resolvePage({ page: 1, limit: 100000 }) });
    assert.equal(resolvePage({ page: 1, limit: 100000 }).limit, MAX_PAGE_SIZE);
    assert.equal(huge.length, 25);

    const invalid = resolvePage({ page: "nope", limit: "nope" });
    assert.deepEqual(invalid, resolvePage(undefined));
    const invalidRows = await getOrders({ ...filter, ...invalid });
    assert.equal(invalidRows.length, 20);

    const clamped = await getOrders({ ...filter, ...resolvePage({ page: 0, limit: -5 }) });
    assert.equal(clamped.length, 1);

    const emptyFilter = { ...filter, q: `${pageToken}-missing` };
    const [emptyRows, emptyTotal] = await Promise.all([
      getOrders({ ...emptyFilter, ...resolvePage({ page: 1, limit: 20 }) }),
      countOrders(emptyFilter),
    ]);
    assert.deepEqual(emptyRows, []);
    assert.equal(emptyTotal, 0);

    const full = await getOrders({ ...filter, ...resolvePage({ page: 1, limit: MAX_PAGE_SIZE }) });
    assert.deepEqual(walked, full.map((row) => row.id));
    assert.equal(new Set(walked).size, 25);
    const ids = [...walked];
    const sorted = [...ids].sort((left, right) => right - left);
    assert.deepEqual(ids, sorted);
  });
});

after(async () => {
  if (keys.length) await prisma.orders.deleteMany({ where: { checkout_key: { in: keys } } });
  if (customerIds.length) await prisma.customers.deleteMany({ where: { id: { in: customerIds } } });
  if (adminIds.length) await prisma.admin_profiles.deleteMany({ where: { id: { in: adminIds } } });
  await prisma.$disconnect();
});
