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
import { authenticate } from "../src/middleware/auth.js";
import authRoutes from "../src/routes/admin/auth.js";
import { updateStaff } from "../src/services/staff.service.js";
import { hashPassword } from "../src/utils/password.js";
import { invalidateAdminAuth } from "../src/utils/cache.js";

const prisma = getPrisma();
const PASSWORD = "session-test-password-1";
const adminIds: string[] = [];
const servers: Server[] = [];
const COOKIE = "crispy_admin_session";

function startApp(): Promise<number> {
  const app = express();
  app.use(express.json());
  app.use(cookieParser());
  app.use("/api/admin/auth", authRoutes);
  app.get("/guard", authenticate, (req, res) => {
    res.json({ ok: true, sub: req.admin?.sub });
  });
  return new Promise((resolve) => {
    const server = app.listen(0, "127.0.0.1", () => {
      servers.push(server);
      resolve((server.address() as AddressInfo).port);
    });
  });
}

const portPromise = startApp();

async function call(path: string, init: { method?: string; token?: string; body?: unknown } = {}) {
  const port = await portPromise;
  const headers: Record<string, string> = {};
  if (init.token) headers.Cookie = `${COOKIE}=${init.token}`;
  if (init.body !== undefined) headers["Content-Type"] = "application/json";
  return fetch(`http://127.0.0.1:${port}${path}`, {
    method: init.method ?? "GET",
    headers,
    body: init.body === undefined ? undefined : JSON.stringify(init.body),
  });
}

/** The session token set by the auth cookie on login or refresh. */
function tokenFrom(res: Response): string {
  const cookie = res.headers.getSetCookie().find((value) => value.startsWith(`${COOKIE}=`));
  assert.ok(cookie, "response should set the admin session cookie");
  return decodeURIComponent(cookie.slice(COOKIE.length + 1).split(";")[0]);
}

async function admin(): Promise<{ id: string; email: string }> {
  const id = crypto.randomUUID();
  const email = `${id}@session.test`;
  adminIds.push(id);
  await prisma.admin_profiles.create({
    data: { id, email, name: "Session Test", role: "superadmin", password_hash: await hashPassword(PASSWORD) },
  });
  return { id, email };
}

async function login(email: string, password = PASSWORD): Promise<string> {
  const res = await call("/api/admin/auth/login", { method: "POST", body: { email, password } });
  assert.equal(res.status, 200);
  return tokenFrom(res);
}

async function guard(token: string): Promise<number> {
  const res = await call("/guard", { token });
  await res.arrayBuffer();
  return res.status;
}

/** Signs a token by hand, for the cases a real login cannot produce. */
function forge(claims: Record<string, unknown>, secret = envConfig.JWT.SECRET, options: jwt.SignOptions = {}) {
  return jwt.sign(claims, secret, { expiresIn: "1h", ...options });
}

describe("admin session revocation", { concurrency: 1 }, () => {
  it("login issues a token that works", async () => {
    const user = await admin();
    const token = await login(user.email);
    assert.equal(await guard(token), 200);
  });

  it("logout revokes the old token", async () => {
    const user = await admin();
    const token = await login(user.email);
    const out = await call("/api/admin/auth/logout", { method: "POST", token });
    assert.equal(out.status, 200);
    await out.arrayBuffer();
    assert.equal(await guard(token), 401);
  });

  it("refresh before logout works, and the new token is valid", async () => {
    const user = await admin();
    const first = await login(user.email);
    const refreshed = await call("/api/admin/auth/refresh", { method: "POST", token: first });
    assert.equal(refreshed.status, 200);
    const second = tokenFrom(refreshed);
    assert.equal(await guard(second), 200);
  });

  it("logout also kills the refreshed token and the original one", async () => {
    const user = await admin();
    const first = await login(user.email);
    const refreshed = await call("/api/admin/auth/refresh", { method: "POST", token: first });
    const second = tokenFrom(refreshed);
    await (await call("/api/admin/auth/logout", { method: "POST", token: second })).arrayBuffer();
    assert.equal(await guard(second), 401);
    assert.equal(await guard(first), 401);
  });

  it("refresh with a token that was logged out fails", async () => {
    const user = await admin();
    const token = await login(user.email);
    await (await call("/api/admin/auth/logout", { method: "POST", token })).arrayBuffer();
    const res = await call("/api/admin/auth/refresh", { method: "POST", token });
    assert.equal(res.status, 401);
    await res.arrayBuffer();
  });

  it("a password change revokes the previous token", async () => {
    const user = await admin();
    const token = await login(user.email);
    assert.equal(await guard(token), 200);
    const actor = { sub: "test-super", role: "superadmin" as const };
    await updateStaff(actor, user.id, { password: "a-new-password-2" });
    assert.equal(await guard(token), 401);
    // The new password works and yields a fresh, valid session.
    const fresh = await login(user.email, "a-new-password-2");
    assert.equal(await guard(fresh), 200);
  });

  it("rejects a token whose version no longer matches the account", async () => {
    const user = await admin();
    const profile = await prisma.admin_profiles.findUniqueOrThrow({ where: { id: user.id } });
    const stale = forge({
      sub: user.id,
      email: user.email,
      role: "superadmin",
      sv: profile.token_version + 5,
      ss: Math.floor(Date.now() / 1000),
    });
    assert.equal(await guard(stale), 401);
  });

  it("rejects an expired token", async () => {
    const user = await admin();
    const profile = await prisma.admin_profiles.findUniqueOrThrow({ where: { id: user.id } });
    const expired = forge(
      { sub: user.id, email: user.email, role: "superadmin", sv: profile.token_version, ss: Math.floor(Date.now() / 1000) },
      envConfig.JWT.SECRET,
      { expiresIn: -60 },
    );
    assert.equal(await guard(expired), 401);
  });

  it("rejects a deactivated account even with a valid token", async () => {
    const user = await admin();
    const token = await login(user.email);
    await prisma.admin_profiles.update({ where: { id: user.id }, data: { is_active: false } });
    await invalidateAdminAuth(user.id);
    assert.equal(await guard(token), 401);
  });

  it("rejects a token signed with the wrong secret", async () => {
    const user = await admin();
    const profile = await prisma.admin_profiles.findUniqueOrThrow({ where: { id: user.id } });
    const forged = forge(
      { sub: user.id, email: user.email, role: "superadmin", sv: profile.token_version, ss: Math.floor(Date.now() / 1000) },
      "not-the-real-secret-value-at-all",
    );
    assert.equal(await guard(forged), 401);
  });

  it("rejects a token from before the version field existed", async () => {
    const user = await admin();
    const legacy = forge({ sub: user.id, email: user.email, role: "superadmin" });
    assert.equal(await guard(legacy), 401);
  });

  it("refuses a session older than the cap, and refresh does not extend it", async () => {
    const user = await admin();
    const profile = await prisma.admin_profiles.findUniqueOrThrow({ where: { id: user.id } });
    const capSeconds = envConfig.JWT.SESSION_MAX_HOURS * 3600;
    const oldStart = Math.floor(Date.now() / 1000) - capSeconds - 60;
    const aged = forge({
      sub: user.id,
      email: user.email,
      role: "superadmin",
      sv: profile.token_version,
      ss: oldStart,
    });
    assert.equal(await guard(aged), 401);

    // A fresh login keeps its start time through refresh, so the age is carried, not reset.
    const token = await login(user.email);
    const refreshed = await call("/api/admin/auth/refresh", { method: "POST", token });
    assert.equal(refreshed.status, 200);
    const next = tokenFrom(refreshed);
    const payload = jwt.decode(next) as { ss: number };
    const original = jwt.decode(token) as { ss: number };
    assert.equal(payload.ss, original.ss);
  });
});

after(async () => {
  await Promise.all(servers.map((server) => new Promise<void>((resolve) => server.close(() => resolve()))));
  if (adminIds.length) await prisma.admin_profiles.deleteMany({ where: { id: { in: adminIds } } });
  await prisma.$disconnect();
});
