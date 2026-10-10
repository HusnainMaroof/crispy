import assert from "node:assert/strict";
import type { AddressInfo } from "node:net";
import type { Server } from "node:http";
import { after, describe, it } from "node:test";
import express from "express";
import cookieParser from "cookie-parser";
import jwt from "jsonwebtoken";
import "dotenv/config";
import { getPrisma } from "../src/config/prisma.js";
import { envConfig } from "../src/config/env.js";
import { authenticate, requireTab } from "../src/middleware/auth.js";
import locationRoutes from "../src/routes/admin/locations.js";
import cmsRoutes from "../src/routes/admin/cms.js";

const prisma = getPrisma();
const adminIds: string[] = [];
const servers: Server[] = [];

const app = express();
app.use(express.json());
app.use(cookieParser());
app.use("/api/admin/locations", authenticate, requireTab("locations", "branches", "staff", "branch-menu", "menu", "orders", "customers"), locationRoutes);
app.use("/api/admin/cms", authenticate, requireTab("content"), cmsRoutes);

const ready = new Promise<number>((resolve) => {
  const server = app.listen(0, "127.0.0.1", () => {
    servers.push(server);
    resolve((server.address() as AddressInfo).port);
  });
});

async function branch(slug: string) {
  const row = await prisma.locations.findUnique({ where: { slug } });
  assert.ok(row, `branch ${slug} must exist for this test`);
  return row;
}

/** A branch manager assigned to exactly one branch, created and removed by this test. */
async function managerOf(locationId: string) {
  const id = crypto.randomUUID();
  adminIds.push(id);
  const profile = await prisma.admin_profiles.create({
    data: { id, email: `${id}@authz.test`, name: "Authz Manager", role: "branch_manager", password_hash: "not-used", tabs: ["menu", "locations", "content"] },
  });
  await prisma.admin_branch_access.create({ data: { admin_id: id, location_id: locationId } });
  const token = jwt.sign(
    { sub: id, email: profile.email, role: "branch_manager", sv: profile.token_version, ss: Math.floor(Date.now() / 1000) },
    envConfig.JWT.SECRET,
    { expiresIn: "1h" },
  );
  return token;
}

async function call(method: string, path: string, token: string, body?: unknown) {
  const port = await ready;
  const res = await fetch(`http://127.0.0.1:${port}${path}`, {
    method,
    headers: { Authorization: `Bearer ${token}`, ...(body === undefined ? {} : { "Content-Type": "application/json" }) },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  await res.arrayBuffer();
  return res.status;
}

describe("branch and CMS authorization", { concurrency: 1 }, () => {
  it("a branch manager can read their own branch", async () => {
    const own = await branch("harrow-road");
    const token = await managerOf(own.id);
    assert.equal(await call("GET", `/api/admin/locations/${own.id}`, token), 200);
  });

  it("a branch manager is refused another branch's location", async () => {
    const own = await branch("harrow-road");
    const other = await branch("tower-hill");
    const token = await managerOf(own.id);
    const status = await call("GET", `/api/admin/locations/${other.id}`, token);
    assert.ok(status === 403 || status === 404, `expected 403 or 404, got ${status}`);
  });

  it("a branch manager cannot write CMS sections", async () => {
    const own = await branch("harrow-road");
    const token = await managerOf(own.id);
    const status = await call("PATCH", "/api/admin/cms/sections/00000000-0000-4000-8000-000000000000", token, {});
    assert.equal(status, 403);
  });

  it("a branch manager cannot reorder or reset CMS sections", async () => {
    const own = await branch("harrow-road");
    const token = await managerOf(own.id);
    const id = "00000000-0000-4000-8000-000000000000";
    assert.equal(await call("POST", `/api/admin/cms/sections/${id}/move`, token, { direction: "up" }), 403);
    assert.equal(await call("POST", `/api/admin/cms/sections/${id}/reset`, token, {}), 403);
  });
});

after(async () => {
  await Promise.all(servers.map((server) => new Promise<void>((resolve) => server.close(() => resolve()))));
  if (adminIds.length) await prisma.admin_profiles.deleteMany({ where: { id: { in: adminIds } } });
  await prisma.$disconnect();
});
