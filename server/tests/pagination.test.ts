import assert from "node:assert/strict";
import { after, describe, it } from "node:test";
import "dotenv/config";
import { getPrisma } from "../src/config/prisma.js";
import { createOrder, countOrders, getOrders, getOrderById, getOrdersByCustomerId, getOrdersByEmail } from "../src/services/order.service.js";
import { listCustomers, getCustomerForStaff } from "../src/services/customer.service.js";
import { listStaff } from "../src/services/staff.service.js";
import { manageableRoleValues, storedRoleValues, storedRolesFor } from "../src/config/admin-roles.js";
import { getSettings, updateSettings } from "../src/services/admin.service.js";
import { buildMeta, resolvePage, DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE } from "../src/utils/pagination.js";
import { NotFoundException, ForbiddenException } from "../src/utils/app-error.js";
import { FIRST_PAGE } from "./helpers/page.js";

const prisma = getPrisma();
const keys: string[] = [];
const customerIds: string[] = [];
const adminIds: string[] = [];
const postIds: string[] = [];

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

/** orders.customer_id is a real foreign key, so the parent row has to exist. */
async function ensureCustomer(id: string, email?: string) {
  await prisma.customers.upsert({
    where: { id },
    // The CRM search reads the customer row's own name/email/phone, which
    // checkout fills in. A row with only an id would never match a search.
    create: { id, ...(email ? { email } : {}) },
    update: {},
  });
}

async function branch(slug: string) {
  const row = await prisma.locations.findUnique({ where: { slug } });
  assert.ok(row, `missing branch ${slug}`);
  return row;
}

/**
 * Inserts orders straight through Prisma with a fixed created_at, so the
 * ordering tests can produce rows that genuinely tie on the sort key. Ties are
 * what made the old created_at-only ordering able to repeat or drop a row
 * between two page requests.
 */
async function seedTiedOrders(locationId: string, customer: string, count: number, createdAt: Date) {
  await ensureCustomer(customer);
  for (let index = 0; index < count; index++) {
    await prisma.orders.create({
      data: {
        customer_name: `Tied ${index}`,
        email: `tied-${customer}@pagination.test`,
        phone: "07111000111",
        fulfilment: "collection",
        payment_method: "cash",
        subtotal: 1,
        delivery_fee: 0,
        total: 1,
        status: "pending",
        location_id: locationId,
        customer_id: customer,
        checkout_key: key(),
        created_at: createdAt,
      },
    });
  }
}

describe("pagination parameters", { concurrency: 1 }, () => {
  it("defaults to the first page at the default size", () => {
    assert.deepEqual(resolvePage(undefined), { page: 1, limit: DEFAULT_PAGE_SIZE, skip: 0 });
  });

  it("computes the offset from the page and limit", () => {
    assert.deepEqual(resolvePage({ page: 3, limit: 25 }), { page: 3, limit: 25, skip: 50 });
  });

  it("caps the limit at the maximum instead of erroring", () => {
    assert.equal(resolvePage({ page: 1, limit: 99999 }).limit, MAX_PAGE_SIZE);
  });

  it("treats zero and negative values as the first page", () => {
    assert.deepEqual(resolvePage({ page: 0, limit: 0 }), { page: 1, limit: 1, skip: 0 });
    assert.deepEqual(resolvePage({ page: -5, limit: -5 }), { page: 1, limit: 1, skip: 0 });
  });

  it("reports zero pages for an empty collection instead of one", () => {
    const meta = buildMeta(1, 20, 0);
    assert.equal(meta.totalPages, 0);
    assert.equal(meta.hasNextPage, false);
    assert.equal(meta.hasPreviousPage, false);
  });

  it("marks the last page as having no next page", () => {
    const meta = buildMeta(2, 20, 25);
    assert.equal(meta.totalPages, 2);
    assert.equal(meta.hasNextPage, false);
    assert.equal(meta.hasPreviousPage, true);
  });
});

describe("order pagination", { concurrency: 1 }, () => {
  it("splits a collection across pages with no duplicates and no gaps", async () => {
    const owner = customerId();
    const location = await branch("stockwell");
    await seedTiedOrders(location.id, owner, 25, new Date("2026-01-01T00:00:00Z"));

    const first = await getOrdersByCustomerId(owner, resolvePage({ page: 1, limit: 10 }));
    const second = await getOrdersByCustomerId(owner, resolvePage({ page: 2, limit: 10 }));
    const third = await getOrdersByCustomerId(owner, resolvePage({ page: 3, limit: 10 }));

    assert.equal(first.total, 25);
    assert.equal(first.orders.length, 10);
    assert.equal(second.orders.length, 10);
    assert.equal(third.orders.length, 5);

    const ids = [...first.orders, ...second.orders, ...third.orders].map((order) => order.id);
    assert.equal(ids.length, 25);
    assert.equal(new Set(ids).size, 25, "a row was repeated across pages");
  });

  it("orders by id as a tiebreaker, so tied rows keep a stable order", async () => {
    const owner = customerId();
    const location = await branch("stockwell");
    // 25 rows sharing one created_at: created_at alone cannot separate them.
    await seedTiedOrders(location.id, owner, 25, new Date("2026-02-02T00:00:00Z"));

    const walked: number[] = [];
    for (let page = 1; page <= 3; page++) {
      const { orders } = await getOrdersByCustomerId(owner, resolvePage({ page, limit: 10 }));
      walked.push(...orders.map((order) => order.id));
    }

    const expected = (await getOrdersByCustomerId(owner, resolvePage({ page: 1, limit: MAX_PAGE_SIZE }))).orders
      .map((order) => order.id);

    assert.deepEqual(walked, expected, "paging the tied rows reordered them");
    assert.equal(new Set(walked).size, 25);
  });

  it("returns an empty page past the end rather than an error", async () => {
    const owner = customerId();
    const location = await branch("stockwell");
    await seedTiedOrders(location.id, owner, 3, new Date("2026-03-03T00:00:00Z"));

    const past = await getOrdersByCustomerId(owner, resolvePage({ page: 99, limit: 20 }));
    assert.deepEqual(past.orders, []);
    assert.equal(past.total, 3, "the total must still describe the collection");
  });

  it("honours limit=1 and clamps a limit above the maximum", async () => {
    const owner = customerId();
    const location = await branch("stockwell");
    await seedTiedOrders(location.id, owner, 4, new Date("2026-04-04T00:00:00Z"));

    const single = await getOrdersByCustomerId(owner, resolvePage({ page: 2, limit: 1 }));
    assert.equal(single.orders.length, 1);

    const capped = await getOrdersByCustomerId(owner, resolvePage({ page: 1, limit: 100000 }));
    assert.equal(capped.orders.length, 4);
    assert.equal(capped.total, 4);
  });

  it("filters by status and branch in the database and counts the same set it pages", async () => {
    const owner = customerId();
    const location = await branch("kilburn");
    await seedTiedOrders(location.id, owner, 6, new Date("2026-05-05T00:00:00Z"));

    const filter = { location_ids: [location.id], status: "pending", q: "Tied" };
    const [rows, total] = await Promise.all([
      getOrders({ ...filter, ...resolvePage({ page: 1, limit: 4 }) }),
      countOrders(filter),
    ]);

    assert.equal(total, 6);
    assert.equal(rows.length, 4);
    assert.equal(rows.every((row) => row.status === "pending"), true);
    assert.equal(rows.every((row) => row.location_id === location.id), true);
  });

  it("returns nothing for a search term that matches no order", async () => {
    const filter = { q: "definitely-not-a-real-customer-9182" };
    const [rows, total] = await Promise.all([
      getOrders({ ...filter, ...FIRST_PAGE }),
      countOrders(filter),
    ]);
    assert.deepEqual(rows, []);
    assert.equal(total, 0);
  });

  it("scopes the email lookup to the owning customer", async () => {
    const owner = customerId();
    const stranger = customerId();
    const location = await branch("stockwell");
    await seedTiedOrders(location.id, owner, 2, new Date("2026-06-06T00:00:00Z"));
    const email = `tied-${owner}@pagination.test`;

    const mine = await getOrdersByEmail(email, owner, FIRST_PAGE);
    const theirs = await getOrdersByEmail(email, stranger, FIRST_PAGE);

    assert.equal(mine.total, 2);
    assert.equal(theirs.total, 0, "the ownership check has to happen in SQL, not after the fetch");
  });
});

describe("customer pagination", { concurrency: 1 }, () => {
  it("counts orders and finds the latest one without loading the history", async () => {
    const owner = customerId();
    const location = await branch("harrow-road");
    const email = `counted-${owner}@pagination.test`;
    await ensureCustomer(owner, email);
    // Three orders, oldest first, so the newest is unambiguously the last.
    for (const day of ["2026-07-01", "2026-07-02", "2026-07-03"]) {
      await prisma.orders.create({
        data: {
          customer_name: "Counted",
          email,
          phone: "07111000111",
          fulfilment: "collection",
          payment_method: "cash",
          subtotal: 1,
          delivery_fee: 0,
          total: 1,
          status: "pending",
          location_id: location.id,
          customer_id: owner,
          checkout_key: key(),
          created_at: new Date(`${day}T00:00:00Z`),
        },
      });
    }

    const { customers, total } = await listCustomers(
      { sub: "admin", role: "superadmin" },
      { q: email, ...FIRST_PAGE },
    );

    assert.equal(total, 1);    assert.equal(customers[0].order_count, 3, "_count must agree with the true history length");
    assert.equal(customers[0].latest_order?.created_at, "2026-07-03T00:00:00.000Z");

    // The detail endpoint still returns the full history, so nothing regressed.
    const detail = await getCustomerForStaff({ sub: "admin", role: "superadmin" }, owner);
    assert.equal(detail.orders.length, 3);
  });
});

describe("staff visibility moved into SQL", { concurrency: 1 }, () => {
  async function manager(locationIds: string[]) {
    const id = crypto.randomUUID();
    adminIds.push(id);
    await prisma.admin_profiles.create({
      data: { id, email: `${id}@pagination.test`, name: "Scoped Manager", role: "branch_manager", password_hash: "not-used" },
    });
    for (const location_id of locationIds) {
      await prisma.admin_branch_access.create({ data: { admin_id: id, location_id } });
    }
    return { sub: id, role: "branch_manager" as const };
  }

  async function member(locationIds: string[], role = "staff") {
    const id = crypto.randomUUID();
    adminIds.push(id);
    await prisma.admin_profiles.create({
      data: { id, email: `${id}@pagination.test`, name: "Scoped Member", role, password_hash: "not-used" },
    });
    for (const location_id of locationIds) {
      await prisma.admin_branch_access.create({ data: { admin_id: id, location_id } });
    }
    return id;
  }

  it("shows a branch manager only team members inside their own branches", async () => {
    const harrow = await branch("harrow-road");
    const tower = await branch("tower-hill");
    const actor = await manager([harrow.id]);
    const inside = await member([harrow.id]);
    const outside = await member([tower.id]);

    const { staff, total } = await listStaff(actor, FIRST_PAGE);
    const ids = staff.map((row) => row.id);

    assert.equal(ids.includes(inside), true, "a team member on their own branch must be listed");
    assert.equal(ids.includes(outside), false, "a team member on another branch must not be listed");
    assert.equal(total, ids.length, "the count must describe the filtered set");
  });

  it("excludes a member whose branch set only partly overlaps", async () => {
    const harrow = await branch("harrow-road");
    const tower = await branch("tower-hill");
    const actor = await manager([harrow.id]);
    // Assigned to both branches, so the actor only owns part of it.
    const straddler = await member([harrow.id, tower.id]);

    const { staff } = await listStaff(actor, FIRST_PAGE);
    assert.equal(staff.map((row) => row.id).includes(straddler), false);
  });

  it("excludes a branch manager from a branch manager's own list", async () => {
    const harrow = await branch("harrow-road");
    const actor = await manager([harrow.id]);
    const peer = await manager([harrow.id]);

    const { staff } = await listStaff(actor, FIRST_PAGE);
    const ids = staff.map((row) => row.id);
    assert.equal(ids.includes(peer), false, "peers are not manageable");
    assert.equal(ids.includes(actor), false, "an actor does not manage themselves");
  });

  it("returns nothing for a manager with no branches assigned", async () => {
    const actor = await manager([]);
    const { staff, total } = await listStaff(actor, FIRST_PAGE);
    assert.deepEqual(staff, []);
    assert.equal(total, 0);
  });

  it("covers exactly the roles the column can store", () => {
    // admin_profiles.role has a CHECK constraint admitting only these three, so
    // the SQL filter has to name exactly these and nothing more.
    assert.deepEqual([...storedRoleValues()].sort(), ["branch_manager", "staff", "superadmin"]);
    assert.deepEqual(storedRolesFor("staff"), ["staff"]);
    assert.deepEqual([...manageableRoleValues("superadmin")].sort(), ["branch_manager", "staff", "superadmin"]);
    assert.deepEqual(manageableRoleValues("branch_manager"), ["staff"]);
    assert.deepEqual(manageableRoleValues("staff"), []);
  });

  it("filters by branch, active state and search term in the database", async () => {
    const harrow = await branch("harrow-road");
    const tower = await branch("tower-hill");
    const actor = await manager([harrow.id, tower.id]);
    const onHarrow = await member([harrow.id]);

    const byBranch = await listStaff(actor, { branch_id: harrow.id, ...FIRST_PAGE });
    assert.equal(byBranch.staff.map((row) => row.id).includes(onHarrow), true);

    const byBranchMiss = await listStaff(actor, { branch_id: tower.id, ...FIRST_PAGE });
    assert.equal(byBranchMiss.staff.map((row) => row.id).includes(onHarrow), false);

    const byText = await listStaff(actor, { q: "Scoped Member", ...FIRST_PAGE });
    assert.equal(byText.total > 0, true);
    assert.equal(byText.staff.every((row) => row.name === "Scoped Member"), true);

    const byMissingText = await listStaff(actor, { q: "zzz-no-such-person-7712", ...FIRST_PAGE });
    assert.equal(byMissingText.total, 0);
  });

  it("still refuses a staff account, who manages nobody", async () => {
    const harrow = await branch("harrow-road");
    const memberActor = await member([harrow.id]);
    await assert.rejects(
      () => listStaff({ sub: memberActor, role: "staff" }, FIRST_PAGE),
      ForbiddenException,
    );
  });
});

describe("regressions fixed during the audit", { concurrency: 1 }, () => {
  it("rejects a malformed order id as a missing order, not a 500", async () => {
    await assert.rejects(() => getOrderById("abc"), NotFoundException);
    await assert.rejects(() => getOrderById("1.5"), NotFoundException);
    await assert.rejects(() => getOrderById(""), NotFoundException);
    await assert.rejects(() => getOrderById("1;DROP TABLE orders"), NotFoundException);
  });

  it("reads the business settings singleton", async () => {
    const settings = await getSettings();
    assert.equal(typeof Number(settings.delivery_fee), "number");
    assert.equal(typeof Number(settings.free_delivery_threshold), "number");
  });

  it("writes to the existing settings row instead of assuming id 1", async () => {
    const before = await getSettings();
    const updated = await updateSettings({ delivery_fee: 3.5 });
    assert.equal(Number(updated.delivery_fee), 3.5);
    // Restore whatever the environment had, so the suite is not order dependent.
    await updateSettings({ delivery_fee: Number(before.delivery_fee) });
  });

  it("still creates a real order through the normal checkout path", async () => {
    const owner = customerId();
    const location = await branch("wembley-central");
    const order = await createOrder({
      customer_name: "Regression Guest",
      email: "regression@pagination.test",
      phone: "07123456789",
      fulfilment: "collection",
      payment_method: "cash",
      location_id: location.id,
      customer_id: owner,
      checkout_key: key(),
      items: [{ kind: "product", id: "mock-burger-classic", quantity: 1 }],
    });
    assert.equal(order.status, "pending");
    assert.equal(order.items.length, 1);
  });
});

after(async () => {
  if (keys.length) await prisma.orders.deleteMany({ where: { checkout_key: { in: keys } } });
  if (customerIds.length) await prisma.customers.deleteMany({ where: { id: { in: customerIds } } });
  if (adminIds.length) await prisma.admin_profiles.deleteMany({ where: { id: { in: adminIds } } });
  if (postIds.length) await prisma.job_applications.deleteMany({ where: { id: { in: postIds } } });
  await prisma.$disconnect();
});
