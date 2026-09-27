import { Prisma } from "../generated/prisma/client.js";
import { getPrisma } from "../config/prisma.js";
import { isAdminTab, tabsForRole, type AdminTabId } from "../config/admin-tabs.js";
import { BadRequestException, ForbiddenException, NotFoundException } from "../utils/app-error.js";
import { hashPassword } from "../utils/password.js";
import { serialize } from "../utils/db.js";
import type { AuthPayload } from "../types/responses.js";

type Actor = Pick<AuthPayload, "sub" | "role">;
type StaffRole = "superadmin" | "admin" | "branch_manager";

const publicSelect = {
  id: true,
  name: true,
  email: true,
  role: true,
  tabs: true,
  is_active: true,
  created_at: true,
  updated_at: true,
  admin_branch_access: {
    select: { location_id: true, location: { select: { name: true } } },
  },
} as const;

function assertCanManageStaff(actor: Actor) {
  if (actor.role === "branch_manager") {
    throw new ForbiddenException("Branch managers cannot manage staff");
  }
}

function assertRoleChange(actor: Actor, nextRole: string, currentRole?: string) {
  if (actor.role === "superadmin") return;
  if (nextRole === "superadmin" || currentRole === "superadmin") {
    throw new ForbiddenException("Only a superadmin can change that role");
  }
}

async function existingBranches(branchIds: string[]) {
  const unique = [...new Set(branchIds)];
  const rows = await getPrisma().locations.findMany({ where: { id: { in: unique } }, select: { id: true } });
  if (rows.length !== unique.length) throw new BadRequestException("One or more branches do not exist");
  return unique;
}

function present(row: {
  id: string;
  name: string;
  email: string;
  role: string;
  tabs: string[];
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
  admin_branch_access: { location_id: string; location: { name: string } | null }[];
}) {
  return serialize({
    id: row.id,
    name: row.name,
    email: row.email,
    role: row.role,
    tabs: row.tabs.filter(isAdminTab),
    is_active: row.is_active,
    created_at: row.created_at,
    updated_at: row.updated_at,
    branches: row.admin_branch_access.map((access) => ({
      id: access.location_id,
      name: access.location?.name ?? "Branch",
    })),
  });
}

export async function listStaff(actor: Actor) {
  assertCanManageStaff(actor);
  const rows = await getPrisma().admin_profiles.findMany({
    select: publicSelect,
    orderBy: { name: "asc" },
  });
  return rows.map(present);
}

export async function getStaff(actor: Actor, id: string) {
  assertCanManageStaff(actor);
  const row = await getPrisma().admin_profiles.findUnique({ where: { id }, select: publicSelect });
  if (!row) throw new NotFoundException("Staff member not found");
  return present(row);
}

function cleanTabs(tabs: string[] | undefined, role: StaffRole): AdminTabId[] {
  const source = tabs?.length ? tabs : tabsForRole(role);
  const unique = [...new Set(source)];
  if (unique.some((tab) => !isAdminTab(tab))) throw new BadRequestException("Unknown tab");
  if (unique.length === 0) throw new BadRequestException("Assign at least one tab");
  return unique.filter(isAdminTab);
}

async function assertTabsGrant(actor: Actor, tabs: string[]) {
  if (actor.role === "superadmin") return;
  const profile = await getPrisma().admin_profiles.findUnique({ where: { id: actor.sub }, select: { role: true, tabs: true } });
  if (!profile || profile.role === "superadmin") return;
  const owned = new Set(profile.tabs);
  if (tabs.some((tab) => !owned.has(tab))) {
    throw new ForbiddenException("You can only assign tabs you have");
  }
}

export async function createStaff(actor: Actor, input: {
  name: string;
  email: string;
  password: string;
  role?: StaffRole;
  tabs?: string[];
  branchIds: string[];
}) {
  assertCanManageStaff(actor);
  const role: StaffRole = input.role ?? (input.branchIds.length > 0 ? "branch_manager" : "admin");
  assertRoleChange(actor, role);
  const tabs = cleanTabs(input.tabs, role);
  await assertTabsGrant(actor, tabs);
  const branchIds = role === "branch_manager" ? await existingBranches(input.branchIds) : [];
  if (role === "branch_manager" && branchIds.length === 0) {
    throw new BadRequestException("Choose at least one branch, or leave branches empty for access to every branch");
  }
  try {
    const row = await getPrisma().admin_profiles.create({
      data: {
        name: input.name,
        email: input.email,
        password_hash: await hashPassword(input.password),
        role,
        tabs,
        admin_branch_access: { create: branchIds.map((location_id) => ({ location_id })) },
      },
      select: publicSelect,
    });
    return present(row);
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      throw new BadRequestException("Email is already in use");
    }
    throw error;
  }
}

export async function updateStaff(actor: Actor, id: string, input: {
  name?: string;
  email?: string;
  password?: string;
  role?: StaffRole;
  tabs?: string[];
  branchIds?: string[];
  is_active?: boolean;
}) {
  assertCanManageStaff(actor);
  if (input.is_active === false && actor.sub === id) {
    throw new BadRequestException("You cannot deactivate your own account");
  }
  const current = await getPrisma().admin_profiles.findUnique({ where: { id }, select: { role: true } });
  if (!current) throw new NotFoundException("Staff member not found");
  if (input.role) assertRoleChange(actor, input.role, current.role);
  else assertRoleChange(actor, current.role, current.role);
  const tabs = input.tabs ? cleanTabs(input.tabs, current.role as StaffRole) : undefined;
  if (tabs) await assertTabsGrant(actor, tabs);

  let role = input.role;
  if (input.branchIds && current.role !== "superadmin") {
    role = input.branchIds.length > 0 ? "branch_manager" : "admin";
  }

  await getPrisma().admin_profiles.update({
    where: { id },
    data: {
      ...(input.name ? { name: input.name } : {}),
      ...(input.email ? { email: input.email } : {}),
      ...(input.password ? { password_hash: await hashPassword(input.password) } : {}),
      ...(role ? { role } : {}),
      ...(tabs ? { tabs } : {}),
      ...(input.is_active !== undefined ? { is_active: input.is_active } : {}),
    },
  });
  if (input.branchIds) return replaceStaffBranches(actor, id, input.branchIds);
  return getStaff(actor, id);
}

export async function setStaffActive(actor: Actor, id: string, isActive: boolean) {
  return updateStaff(actor, id, { is_active: isActive });
}

export async function replaceStaffBranches(actor: Actor, id: string, branchIds: string[]) {
  assertCanManageStaff(actor);
  const current = await getPrisma().admin_profiles.findUnique({ where: { id }, select: { role: true } });
  if (!current) throw new NotFoundException("Staff member not found");
  assertRoleChange(actor, current.role, current.role);
  const unique = await existingBranches(branchIds);
  if (current.role === "branch_manager" && unique.length === 0) {
    throw new BadRequestException("A branch manager needs at least one branch");
  }
  await getPrisma().$transaction([
    getPrisma().admin_branch_access.deleteMany({ where: { admin_id: id } }),
    getPrisma().admin_branch_access.createMany({
      data: unique.map((location_id) => ({ admin_id: id, location_id })),
    }),
  ]);
  return getStaff(actor, id);
}

export async function countStaffByLocation() {
  const rows = await getPrisma().admin_branch_access.groupBy({
    by: ["location_id"],
    _count: { admin_id: true },
  });
  return new Map(rows.map((row) => [row.location_id, row._count.admin_id]));
}
