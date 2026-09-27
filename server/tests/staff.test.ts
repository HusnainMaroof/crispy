import assert from "node:assert/strict";
import { after, describe, it } from "node:test";
import type { Request, Response } from "express";
import jwt from "jsonwebtoken";
import "dotenv/config";
import { getPrisma } from "../src/config/prisma.js";
import { envConfig } from "../src/config/env.js";
import { authenticate } from "../src/middleware/auth.js";
import { AuthController } from "../src/controllers/admin/auth.controller.js";
import { getAccessibleLocationIds, assertLocationAccess } from "../src/services/branch-access.service.js";
import { createStaff, listStaff, replaceStaffBranches, setStaffActive, updateStaff } from "../src/services/staff.service.js";
import { updateLocation } from "../src/services/admin.service.js";
import { createOrder } from "../src/services/order.service.js";
import { getCustomerForStaff } from "../src/services/customer.service.js";
import { BadRequestException, ForbiddenException, NotFoundException, UnauthorizedException } from "../src/utils/app-error.js";

const prisma = getPrisma();
const staffIds: string[] = [];
const locationIds: string[] = [];
const orderIds: bigint[] = [];
const customerIds: string[] = [];

const admin = { sub: "stage12-admin", role: "admin" as const };
const superadmin = { sub: "stage12-super", role: "superadmin" as const };

function response() {
  return {
    body: undefined as unknown,
    status() { return this; },
    json(body: unknown) { this.body = body; return this; },
  };
}

async function branch(slug: string) {
  const row = await prisma.locations.findUnique({ where: { slug } });
  assert.ok(row);
  return row;
}

async function hire(role: "admin" | "branch_manager" | "superadmin", branchIds: string[] = [], active = true) {
  const email = `${crypto.randomUUID()}@stage12.test`;
  const person = await createStaff(role === "superadmin" ? superadmin : admin, {
    name: "Stage Twelve",
    email,
    password: "correct-horse",
    role,
    branchIds,
  });
  staffIds.push(person.id);
  if (!active) await setStaffActive(superadmin, person.id, false);
  return { ...person, email, password: "correct-horse" };
}

describe("staff and branches", { concurrency: 1 }, () => {
  it("lets active staff sign in and rejects a bad password or unknown email the same way", async () => {
    const person = await hire("admin");
    const ok = response();
    await AuthController.login({ body: { email: person.email, password: person.password } } as Request, ok as unknown as Response);
    const body = ok.body as { data: { user: Record<string, unknown>; token: string } };
    assert.equal(body.data.user.email, person.email);
    assert.equal("password_hash" in body.data.user, false);
    assert.equal(JSON.stringify(body).includes("password"), false);

    await assert.rejects(
      () => AuthController.login({ body: { email: person.email, password: "wrong-password" } } as Request, response() as unknown as Response),
      (error: unknown) => error instanceof UnauthorizedException && error.message === "Invalid email or password",
    );
    await assert.rejects(
      () => AuthController.login({ body: { email: "missing@stage12.test", password: "correct-horse" } } as Request, response() as unknown as Response),
      (error: unknown) => error instanceof UnauthorizedException && error.message === "Invalid email or password",
    );
  });

  it("rejects login and an existing token after deactivation", async () => {
    const person = await hire("branch_manager", [(await branch("harrow-road")).id]);
    await setStaffActive(admin, person.id, false);
    await assert.rejects(
      () => AuthController.login({ body: { email: person.email, password: person.password } } as Request, response() as unknown as Response),
      (error: unknown) => error instanceof UnauthorizedException && error.message === "Invalid email or password",
    );

    const token = jwt.sign({ sub: person.id, email: person.email, role: "admin" }, envConfig.JWT.SECRET, { expiresIn: "1h" });
    let status = 0;
    const res = {
      status(code: number) { status = code; return this; },
      json() { return this; },
    };
    await authenticate(
      { headers: { authorization: `Bearer ${token}` } } as Request,
      res as unknown as Response,
      () => { status = 200; },
    );
    assert.equal(status, 401);
  });

  it("lets admin and superadmin manage staff and rejects a manager", async () => {
    const harrow = await branch("harrow-road");
    const manager = await hire("branch_manager", [harrow.id]);
    const created = await createStaff(superadmin, {
      name: "Another Admin",
      email: `${crypto.randomUUID()}@stage12.test`,
      password: "correct-horse",
      role: "admin",
      branchIds: [],
    });
    staffIds.push(created.id);
    assert.equal((await listStaff(admin)).some((row) => row.id === created.id), true);
    assert.equal(JSON.stringify(await listStaff(admin)).includes("password_hash"), false);
    await assert.rejects(() => listStaff({ sub: manager.id, role: "branch_manager" }), ForbiddenException);
    await assert.rejects(
      () => createStaff({ sub: manager.id, role: "branch_manager" }, {
        name: "Escalated",
        email: `${crypto.randomUUID()}@stage12.test`,
        password: "correct-horse",
        role: "superadmin",
        branchIds: [],
      }),
      ForbiddenException,
    );
    await assert.rejects(
      () => updateStaff(admin, created.id, { role: "superadmin" }),
      ForbiddenException,
    );
    await assert.rejects(
      () => replaceStaffBranches({ sub: manager.id, role: "branch_manager" }, manager.id, [harrow.id]),
      ForbiddenException,
    );
  });

  it("grants and removes branch access without trusting a requested branch", async () => {
    const harrow = await branch("harrow-road");
    const tower = await branch("tower-hill");
    const kilburn = await branch("kilburn");
    const manager = await hire("branch_manager", [harrow.id, tower.id]);
    const actor = { sub: manager.id, role: "branch_manager" as const };

    let allowed = await getAccessibleLocationIds(actor);
    assert.ok(allowed?.includes(harrow.id));
    assert.ok(allowed?.includes(tower.id));
    assert.equal(allowed?.includes(kilburn.id), false);
    await assertLocationAccess(actor, harrow.id);
    await assert.rejects(() => assertLocationAccess(actor, kilburn.id), ForbiddenException);

    await replaceStaffBranches(admin, manager.id, [harrow.id]);
    allowed = await getAccessibleLocationIds(actor);
    assert.deepEqual(allowed, [harrow.id]);
    await assert.rejects(() => assertLocationAccess(actor, tower.id), ForbiddenException);

    await replaceStaffBranches(admin, manager.id, [harrow.id, kilburn.id]);
    allowed = await getAccessibleLocationIds(actor);
    assert.ok(allowed?.includes(kilburn.id));
    assert.equal(allowed?.includes(tower.id), false);

    await assert.rejects(
      () => replaceStaffBranches(admin, manager.id, ["not-a-real-branch"]),
      BadRequestException,
    );
  });

  it("keeps Stage 11 customer visibility inside the assigned branches", async () => {
    const harrow = await branch("harrow-road");
    const tower = await branch("tower-hill");
    const manager = await hire("branch_manager", [harrow.id]);
    const owner = crypto.randomUUID();
    customerIds.push(owner);
    const order = await createOrder({
      customer_name: "Shared Guest",
      email: `${owner}@stage12.test`,
      phone: "07111000999",
      fulfilment: "collection",
      payment_method: "cash",
      location_id: harrow.id,
      customer_id: owner,
      checkout_key: crypto.randomUUID(),
      items: [{ kind: "product", id: "mock-burger-classic", quantity: 1 }],
    });
    orderIds.push(BigInt(order.id));
    const towerOrder = await createOrder({
      customer_name: "Shared Guest",
      email: `${owner}@stage12.test`,
      phone: "07111000999",
      fulfilment: "collection",
      payment_method: "cash",
      location_id: tower.id,
      customer_id: owner,
      checkout_key: crypto.randomUUID(),
      items: [{ kind: "product", id: "mock-burger-classic", quantity: 1 }],
    });
    orderIds.push(BigInt(towerOrder.id));

    const visible = await getCustomerForStaff({ sub: manager.id, role: "branch_manager" }, owner);
    assert.deepEqual(visible.orders.map((row) => row.id), [order.id]);
    const outsider = await hire("branch_manager", [tower.id]);
    const towerView = await getCustomerForStaff({ sub: outsider.id, role: "branch_manager" }, owner);
    assert.deepEqual(towerView.orders.map((row) => row.id), [towerOrder.id]);
    const kilburn = await hire("branch_manager", [(await branch("kilburn")).id]);
    await assert.rejects(
      () => getCustomerForStaff({ sub: kilburn.id, role: "branch_manager" }, owner),
      NotFoundException,
    );
  });

  it("deactivates a branch without removing its orders", async () => {
    const id = crypto.randomUUID();
    locationIds.push(id);
    await prisma.locations.create({
      data: { id, name: "Stage 12 Temporary", slug: `stage12-${id}`, address: "1 Test Street", hours: "9-5", phone: "0", status: "active" },
    });
    const order = await prisma.orders.create({
      data: {
        customer_name: "History",
        email: "history@stage12.test",
        phone: "07111000888",
        subtotal: 9.25,
        total: 9.25,
        location_id: id,
      },
    });
    orderIds.push(order.id);
    const updated = await updateLocation(id, { status: "inactive" });
    assert.equal(updated.status, "inactive");
    const saved = await prisma.orders.findUnique({ where: { id: order.id } });
    assert.equal(saved?.location_id, id);
    assert.equal(Number(saved?.total), 9.25);
  });
});

after(async () => {
  if (orderIds.length) await prisma.orders.deleteMany({ where: { id: { in: orderIds } } });
  if (customerIds.length) await prisma.customers.deleteMany({ where: { id: { in: customerIds } } });
  if (staffIds.length) await prisma.admin_profiles.deleteMany({ where: { id: { in: staffIds } } });
  if (locationIds.length) await prisma.locations.deleteMany({ where: { id: { in: locationIds } } });
  await prisma.$disconnect();
});
