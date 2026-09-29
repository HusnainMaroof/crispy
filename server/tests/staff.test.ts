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
import { resolveTabs } from "../src/config/admin-tabs.js";
import { updateLocation } from "../src/services/admin.service.js";
import { createOrder } from "../src/services/order.service.js";
import { getCustomerForStaff } from "../src/services/customer.service.js";
import { BadRequestException, ForbiddenException, NotFoundException, UnauthorizedException } from "../src/utils/app-error.js";

const prisma = getPrisma();
const staffIds: string[] = [];
const locationIds: string[] = [];
const orderIds: bigint[] = [];
const customerIds: string[] = [];

const superadmin = { sub: "stage12-super", role: "superadmin" as const };

function response() {
  return {
    body: undefined as unknown,
    cookieValue: undefined as { name: string; value: string; options: Record<string, unknown> } | undefined,
    clearedCookie: undefined as { name: string; options: Record<string, unknown> } | undefined,
    status() { return this; },
    json(body: unknown) { this.body = body; return this; },
    cookie(name: string, value: string, options: Record<string, unknown>) {
      this.cookieValue = { name, value, options };
      return this;
    },
    clearCookie(name: string, options: Record<string, unknown>) {
      this.clearedCookie = { name, options };
      return this;
    },
  };
}

async function branch(slug: string) {
  const row = await prisma.locations.findUnique({ where: { slug } });
  assert.ok(row);
  return row;
}

async function hire(role: "branch_manager" | "superadmin", branchIds: string[] = [], active = true) {
  const email = `${crypto.randomUUID()}@stage12.test`;
  const person = await createStaff(superadmin, {
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
    const person = await hire("branch_manager", [(await branch("harrow-road")).id]);
    const ok = response();
    await AuthController.login({ body: { email: person.email, password: person.password } } as Request, ok as unknown as Response);
    const body = ok.body as { data: { user: Record<string, unknown> } };
    assert.equal(body.data.user.email, person.email);
    assert.equal("password_hash" in body.data.user, false);
    assert.equal("token" in body.data, false);
    assert.equal(JSON.stringify(body).includes("password"), false);
    assert.equal(ok.cookieValue?.name, "crispy_admin_session");
    assert.equal(ok.cookieValue?.options.httpOnly, true);
    assert.equal(ok.cookieValue?.options.sameSite, "lax");

    let authStatus = 0;
    const authRes = {
      status(code: number) { authStatus = code; return this; },
      json() { return this; },
    };
    await authenticate(
      { headers: {}, cookies: { crispy_admin_session: ok.cookieValue?.value } } as Request,
      authRes as unknown as Response,
      () => { authStatus = 200; },
    );
    assert.equal(authStatus, 200);

    const logout = response();
    await AuthController.logout({} as Request, logout as unknown as Response);
    assert.equal(logout.clearedCookie?.name, "crispy_admin_session");
    assert.equal(logout.clearedCookie?.options.httpOnly, true);

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
    await setStaffActive(superadmin, person.id, false);
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

  it("lets the super admin manage managers and keeps managers within their branch", async () => {
    const harrow = await branch("harrow-road");
    const tower = await branch("tower-hill");
    const manager = await hire("branch_manager", [harrow.id]);
    const managerActor = { sub: manager.id, role: "branch_manager" as const };
    const created = await createStaff(superadmin, {
      name: "Another Manager",
      email: `${crypto.randomUUID()}@stage12.test`,
      password: "correct-horse",
      role: "branch_manager",
      branchIds: [tower.id],
    });
    staffIds.push(created.id);

    const ownerView = await listStaff(superadmin);
    assert.equal(ownerView.some((row) => row.id === manager.id), true);
    assert.equal(ownerView.some((row) => row.id === created.id), true);
    assert.equal(JSON.stringify(ownerView).includes("password_hash"), false);
    await assert.rejects(() => updateStaff(managerActor, created.id, { name: "Nope" }), ForbiddenException);
    await assert.rejects(
      () => createStaff(managerActor, {
        name: "Escalated",
        email: `${crypto.randomUUID()}@stage12.test`,
        password: "correct-horse",
        role: "branch_manager",
        branchIds: [harrow.id],
      }),
      ForbiddenException,
    );
    await assert.rejects(
      () => updateStaff(managerActor, created.id, { role: "superadmin" }),
      ForbiddenException,
    );

    // The owner can add branch managers.
    const made = await createStaff(superadmin, {
      name: "Made By Owner",
      email: `${crypto.randomUUID()}@stage12.test`,
      password: "correct-horse",
      role: "branch_manager",
      branchIds: [harrow.id],
    });
    staffIds.push(made.id);

    // A branch manager adds team members to their own branch only…
    const teamMember = await createStaff(managerActor, {
      name: "Shop Team",
      email: `${crypto.randomUUID()}@stage12.test`,
      password: "correct-horse",
      role: "staff",
      branchIds: [harrow.id],
    });
    staffIds.push(teamMember.id);
    assert.equal((await listStaff(managerActor)).some((row) => row.id === teamMember.id), true);
    // …never a super admin or another manager…
    for (const role of ["superadmin", "branch_manager"] as const) {
      await assert.rejects(
        () => createStaff(managerActor, {
          name: "Escalated",
          email: `${crypto.randomUUID()}@stage12.test`,
          password: "correct-horse",
          role,
          branchIds: [harrow.id],
        }),
        ForbiddenException,
      );
    }
    // …and only inside their own branches.
    await assert.rejects(
      () => createStaff(managerActor, {
        name: "Other Branch",
        email: `${crypto.randomUUID()}@stage12.test`,
        password: "correct-horse",
        role: "staff",
        branchIds: [tower.id],
      }),
      ForbiddenException,
    );
    await assert.rejects(() => updateStaff(managerActor, manager.id, { name: "Self Edit" }), ForbiddenException);
    await assert.rejects(() => replaceStaffBranches(managerActor, manager.id, [harrow.id]), ForbiddenException);

    // A team member cannot manage anyone at all.
    const memberActor = { sub: teamMember.id, role: "staff" as const };
    await assert.rejects(() => listStaff(memberActor), ForbiddenException);
    await assert.rejects(
      () => createStaff(memberActor, {
        name: "Escalated",
        email: `${crypto.randomUUID()}@stage12.test`,
        password: "correct-horse",
        role: "branch_manager",
        branchIds: [],
      }),
      ForbiddenException,
    );
  });

  it("never hands the Team area to a team member", async () => {
    const harrow = await branch("harrow-road");
    assert.equal(resolveTabs("staff", ["dashboard", "staff"]).includes("staff"), false);
    assert.equal(resolveTabs("branch_manager", []).includes("staff"), true);
    const teamMember = await createStaff(superadmin, {
      name: "No Team Tab",
      email: `${crypto.randomUUID()}@stage12.test`,
      password: "correct-horse",
      role: "staff",
      tabs: ["dashboard", "orders", "staff"],
      branchIds: [harrow.id],
    });
    staffIds.push(teamMember.id);
    assert.equal(teamMember.tabs.includes("staff"), false);
    const updated = await updateStaff(superadmin, teamMember.id, { tabs: ["dashboard", "staff"] });
    assert.equal(updated.tabs.includes("staff"), false);
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

    await replaceStaffBranches(superadmin, manager.id, [harrow.id]);
    allowed = await getAccessibleLocationIds(actor);
    assert.deepEqual(allowed, [harrow.id]);
    await assert.rejects(() => assertLocationAccess(actor, tower.id), ForbiddenException);

    await replaceStaffBranches(superadmin, manager.id, [harrow.id, kilburn.id]);
    allowed = await getAccessibleLocationIds(actor);
    assert.ok(allowed?.includes(kilburn.id));
    assert.equal(allowed?.includes(tower.id), false);

    await assert.rejects(
      () => replaceStaffBranches(superadmin, manager.id, ["not-a-real-branch"]),
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
