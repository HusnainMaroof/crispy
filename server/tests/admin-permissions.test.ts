import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { Request, Response, NextFunction } from "express";
import { ADMIN_ROLES, canManageRole, normalizeRole } from "../src/config/admin-roles.js";
import { resolveTabs } from "../src/config/admin-tabs.js";
import { accessibleLocationIds } from "../src/services/branch-access.service.js";
import { createStaffSchema } from "../src/validators/admin.schema.js";
import { requireRole, requireTab } from "../src/middleware/auth.js";

describe("three panel permissions", () => {
  it("accepts only the three current roles for new accounts", () => {
    assert.deepEqual(ADMIN_ROLES, ["superadmin", "branch_manager", "staff"]);
    const profile = { name: "Alex", email: "alex@example.com", password: "long-password", branchIds: ["branch-1"], tabs: ["orders"] };
    assert.equal(createStaffSchema.safeParse({ ...profile, role: "admin" }).success, false);
    assert.equal(createStaffSchema.safeParse({ ...profile, role: "branch_manager" }).success, true);
    assert.equal(normalizeRole("admin"), "branch_manager");
  });

  it("prevents branch managers and team members from crossing role boundaries", () => {
    assert.equal(canManageRole("branch_manager", "staff"), true);
    assert.equal(canManageRole("branch_manager", "branch_manager"), false);
    assert.equal(canManageRole("staff", "staff"), false);
    assert.equal(canManageRole("superadmin", "branch_manager"), true);
  });

  it("caps stored tabs and keeps branch accounts scoped to their assignments", () => {
    assert.deepEqual(resolveTabs("branch_manager", ["orders", "staff", "settings", "content"]), ["orders", "staff"]);
    assert.deepEqual(resolveTabs("staff", ["orders", "staff", "settings"]), ["orders"]);
    assert.deepEqual(accessibleLocationIds("branch_manager", ["branch-1"]), ["branch-1"]);
    assert.deepEqual(accessibleLocationIds("staff", []), []);
    assert.equal(accessibleLocationIds("superadmin", []), null);
  });

  it("rejects a staff member from manager-only API actions", () => {
    let status = 0;
    let granted = false;
    const request = { admin: { sub: "staff-1", email: "staff@example.com", role: "staff", tabs: ["menu"] } } as Request;
    const response = { status(code: number) { status = code; return this; }, json() { return this; } } as unknown as Response;
    const next = (() => { granted = true; }) as NextFunction;
    requireRole("superadmin", "branch_manager")(request, response, next);
    assert.equal(status, 403);
    assert.equal(granted, false);
    requireTab("content")(request, response, next);
    assert.equal(status, 403);
    assert.equal(granted, false);
  });
});
