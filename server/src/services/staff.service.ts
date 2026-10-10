import { Prisma } from "../generated/prisma/client.js";
import { getPrisma } from "../config/prisma.js";
import { logger } from "../middleware/logger.js";
import { isAdminTab, resolveTabs, tabsForRole, type AdminTabId } from "../config/admin-tabs.js";
import {
  canManageRole,
  isBranchScoped,
  isTeamMemberRole,
  manageableRoleValues,
  normalizeRole,
  storedRolesFor,
  type AdminRole,
} from "../config/admin-roles.js";
import { BadRequestException, ForbiddenException, NotFoundException } from "../utils/app-error.js";
import { invalidateAdminAuth } from "../utils/cache.js";
import { hashPassword } from "../utils/password.js";
import { serialize } from "../utils/db.js";
import type { PageRequest } from "../utils/pagination.js";
import type { AuthPayload } from "../types/responses.js";

type Actor = Pick<AuthPayload, "sub" | "role">;
type StaffRole = AdminRole;

const publicSelect = {
  id: true,
  name: true,
  email: true,
  role: true,
  position: true,
  tabs: true,
  is_active: true,
  created_at: true,
  updated_at: true,
  admin_branch_access: {
    select: { location_id: true, location: { select: { name: true } } },
  },
} as const;

/** The list view's columns. Branch assignments are read separately, in `listStaff`. */
const listSelect = {
  id: true,
  name: true,
  email: true,
  role: true,
  position: true,
  tabs: true,
  is_active: true,
  created_at: true,
  updated_at: true,
} as const;

function assertCanManageStaff(actor: Actor) {
  if (isTeamMemberRole(actor.role)) {
    throw new ForbiddenException("This account cannot manage staff");
  }
}

function assertCanManageTarget(actor: Actor, targetRole: string) {
  if (!canManageRole(actor.role, targetRole)) {
    throw new ForbiddenException("You can only manage people below your own role");
  }
}

async function actorBranchIds(actor: Actor) {
  const rows = await getPrisma().admin_branch_access.findMany({
    where: { admin_id: actor.sub },
    select: { location_id: true },
  });
  return rows.map((row) => row.location_id);
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
  position: string | null;
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
    role: normalizeRole(row.role),
    position: row.position,
    tabs: resolveTabs(row.role, row.tabs),
    is_active: row.is_active,
    created_at: row.created_at,
    updated_at: row.updated_at,
    branches: row.admin_branch_access.map((access) => ({
      id: access.location_id,
      name: access.location?.name ?? "Branch",
    })),
  });
}

function sharesBranch(row: { admin_branch_access: { location_id: string }[] }, branchIds: string[]) {
  return row.admin_branch_access.length > 0 && row.admin_branch_access.every((access) => branchIds.includes(access.location_id));
}

/** Branch managers only ever see and manage team members of their own branches. */
async function assertTargetInScope(actor: Actor, row: { admin_branch_access: { location_id: string }[] }) {
  if (normalizeRole(actor.role) !== "branch_manager") return;
  const mine = await actorBranchIds(actor);
  if (!sharesBranch(row, mine)) throw new NotFoundException("Staff member not found");
}

/**
 * The visibility rule, expressed as a Prisma where clause.
 *
 * This used to be applied in JavaScript: every admin_profiles row was fetched,
 * then filtered with canManageRole and sharesBranch. Server-side paging
 * requires the row set to be narrowed before it is counted and sliced, so the
 * same predicate now runs in the database:
 *
 *   role IN (...)          the tiers the actor may manage, alias-aware, so a
 *                          legacy "branch_admin" row is still visible
 *   admin_branch_access    a branch manager sees only team members whose every
 *     some/every           branch is one of their own, matching sharesBranch
 */
async function staffVisibility(actor: Actor) {
  const roleFilter = { role: { in: manageableRoleValues(actor.role) } };

  if (normalizeRole(actor.role) !== "branch_manager") return roleFilter;

  const mine = await actorBranchIds(actor);
  return {
    ...roleFilter,
    role: { in: storedRolesFor("staff") },
    AND: [
      { admin_branch_access: { some: {} } },
      { admin_branch_access: { every: { location_id: { in: mine } } } },
    ],
  };
}

export async function listStaff(
  actor: Actor,
  options: {
    q?: string;
    role?: string;
    is_active?: boolean;
    branch_id?: string;
  } & PageRequest,
) {
  assertCanManageStaff(actor);
  const visibility = await staffVisibility(actor);
  const q = options.q?.trim();

  const where = {
    AND: [
      visibility,
      ...(options.role
        ? [{ role: { in: storedRolesFor(normalizeRole(options.role)) } }]
        : []),
      ...(options.is_active !== undefined ? [{ is_active: options.is_active }] : []),
      ...(options.branch_id ? [{ admin_branch_access: { some: { location_id: options.branch_id } } }] : []),
      ...(q
        ? [{
            OR: [
              { name: { contains: q, mode: "insensitive" as const } },
              { email: { contains: q, mode: "insensitive" as const } },
              { position: { contains: q, mode: "insensitive" as const } },
            ],
          }]
        : []),
    ],
  };

  // Independent reads, run concurrently (same tradeoff as the orders, jobs and
  // applications lists): latency is max(findMany, count), and a concurrent write
  // can make the count differ from the rows by one, which is harmless here.
  // The page, its total, and the branch names are independent, so they share
  // one wave. The branch assignments depend on the page's ids, so they are read
  // in a second, batched query. This replaces the nested include, which chained
  // assignments and then branch names as two more waits.
  const [rows, total, locations] = await Promise.all([
    getPrisma().admin_profiles.findMany({
      where,
      select: listSelect,
      skip: options.skip,
      take: options.limit,
      // id ASC is the tiebreaker so two people with the same name cannot swap
      // places between two page requests.
      orderBy: [{ name: "asc" }, { id: "asc" }],
    }),
    getPrisma().admin_profiles.count({ where }),
    getPrisma().locations.findMany({ select: { id: true, name: true } }),
  ]);

  const access = rows.length === 0
    ? []
    : await getPrisma().admin_branch_access.findMany({
        where: { admin_id: { in: rows.map((row) => row.id) } },
        select: { admin_id: true, location_id: true },
      });
  const branchName = new Map(locations.map((location) => [location.id, location.name]));
  const branchesByStaff = new Map<string, { location_id: string; location: { name: string } | null }[]>();
  for (const link of access) {
    const name = branchName.get(link.location_id);
    const list = branchesByStaff.get(link.admin_id) ?? [];
    list.push({ location_id: link.location_id, location: name === undefined ? null : { name } });
    branchesByStaff.set(link.admin_id, list);
  }

  const staff = rows.map((row) => present({ ...row, admin_branch_access: branchesByStaff.get(row.id) ?? [] }));
  return { staff, total };
}

export async function getStaff(actor: Actor, id: string) {
  assertCanManageStaff(actor);
  const row = await getPrisma().admin_profiles.findUnique({ where: { id }, select: publicSelect });
  if (!row || !canManageRole(actor.role, row.role)) throw new NotFoundException("Staff member not found");
  await assertTargetInScope(actor, row);
  return present(row);
}

/**
 * Flexible tab assignment: any valid mix of tabs can be chosen, with two rules:
 * a team member (staff) never receives the Team tab, and non-super-admins can
 * only hand out tabs they hold themselves (assertTabsGrant).
 */
function cleanTabs(tabs: string[] | undefined, role: StaffRole): AdminTabId[] {
  const source = tabs?.length ? tabs : tabsForRole(role);
  const unique = [...new Set(source)];
  if (unique.some((tab) => !isAdminTab(tab))) throw new BadRequestException("Unknown tab");
  // A role-forbidden area is dropped rather than granted: resolveTabs caps the set.
  const allowed = resolveTabs(role, unique);
  if (allowed.length === 0) throw new BadRequestException("Assign at least one tab");
  return allowed;
}

async function assertTabsGrant(actor: Actor, tabs: string[]) {
  if (normalizeRole(actor.role) === "superadmin") return;
  const profile = await getPrisma().admin_profiles.findUnique({ where: { id: actor.sub }, select: { role: true, tabs: true } });
  if (!profile) throw new ForbiddenException("Account not found");
  const owned = new Set(resolveTabs(profile.role, profile.tabs));
  if (tabs.some((tab) => !owned.has(tab as AdminTabId))) {
    throw new ForbiddenException("You can only assign tabs you have");
  }
}

export async function createStaff(actor: Actor, input: {
  name: string;
  email: string;
  password: string;
  role?: string;
  position?: string | null;
  tabs?: string[];
  branchIds: string[];
}) {
  assertCanManageStaff(actor);
  // A branch manager may only add team members; anything higher is refused,
  // not silently downgraded.
  const role: StaffRole = normalizeRole(input.role ?? "staff");
  assertCanManageTarget(actor, role);
  const tabs = cleanTabs(input.tabs, role);
  await assertTabsGrant(actor, tabs);
  let requestedBranches = input.branchIds;
  if (normalizeRole(actor.role) === "branch_manager") {
    const mine = await actorBranchIds(actor);
    if (requestedBranches.some((id) => !mine.includes(id))) throw new ForbiddenException("You can only assign your branches");
    requestedBranches = requestedBranches.length > 0 ? requestedBranches : mine;
    if (requestedBranches.length === 0) throw new ForbiddenException("You can only add staff to your branch");
  }
  const needsBranch = isBranchScoped(role);
  const branchIds = needsBranch ? await existingBranches(requestedBranches) : [];
  if (needsBranch && branchIds.length === 0) {
    throw new BadRequestException("Choose at least one branch");
  }
  try {
    const row = await getPrisma().admin_profiles.create({
      data: {
        name: input.name,
        email: input.email,
        password_hash: await hashPassword(input.password),
        role,
        position: role === "staff" ? input.position?.trim() || null : null,
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
  role?: string;
  position?: string | null;
  tabs?: string[];
  branchIds?: string[];
  is_active?: boolean;
}) {
  assertCanManageStaff(actor);
  if (input.is_active === false && actor.sub === id) {
    throw new BadRequestException("You cannot deactivate your own account");
  }
  const current = await getPrisma().admin_profiles.findUnique({
    where: { id },
    select: { role: true, tabs: true, admin_branch_access: { select: { location_id: true } } },
  });
  if (!current) throw new NotFoundException("Staff member not found");
  assertCanManageTarget(actor, current.role);
  await assertTargetInScope(actor, current);

  const role = input.role ? normalizeRole(input.role) : normalizeRole(current.role);
  if (input.role) assertCanManageTarget(actor, role);

  const tabs = input.tabs ? cleanTabs(input.tabs, role) : input.role ? cleanTabs(current.tabs, role) : undefined;
  if (tabs) await assertTabsGrant(actor, tabs);

  let branchIds: string[] | undefined;
  if (isBranchScoped(role)) {
    const requested = input.branchIds ?? current.admin_branch_access.map((access) => access.location_id);
    // Only a role or branch reassignment demands a branch. A bare
    // is_active flip (reactivation) must not 400, or an account whose
    // branches were cleared can never be switched back on.
    if (requested.length === 0 && (input.role || input.branchIds)) throw new BadRequestException("Choose at least one branch");
    if (normalizeRole(actor.role) === "branch_manager") {
      const mine = await actorBranchIds(actor);
      if (requested.some((branchId) => !mine.includes(branchId))) throw new ForbiddenException("You can only assign your branches");
    }
    if (input.branchIds) branchIds = await existingBranches(requested);
  } else if (input.branchIds || input.role) {
    if (input.branchIds?.length) throw new BadRequestException("Branches only apply to branch managers and team members");
    branchIds = [];
  }

  await getPrisma().admin_profiles.update({
    where: { id },
    data: {
      ...(input.name ? { name: input.name } : {}),
      ...(input.email ? { email: input.email } : {}),
      ...(input.password ? { password_hash: await hashPassword(input.password) } : {}),
      ...(input.role ? { role } : {}),
      ...(role !== "staff" ? { position: null } : input.position !== undefined ? { position: input.position?.trim() || null } : {}),
      ...(tabs ? { tabs } : {}),
      ...(input.is_active !== undefined ? { is_active: input.is_active } : {}),
      // Security events end every live session of this account: a new password,
      // a deactivation, or a role change. The next request with an old token fails.
      ...(input.password || input.is_active === false || input.role
        ? { token_version: { increment: 1 } }
        : {}),
      ...(branchIds !== undefined ? { admin_branch_access: { deleteMany: {}, create: branchIds.map((location_id) => ({ location_id })) } } : {}),
    },
  });

  // Drop the cached auth profile so a role, tab, or active-flag change takes
  // effect on the very next request instead of after the cache TTL.
  void invalidateAdminAuth(id);

  return getStaff(actor, id);
}

export async function setStaffActive(actor: Actor, id: string, isActive: boolean) {
  return updateStaff(actor, id, { is_active: isActive });
}

/**
 * Removes a team member's login entirely. Deactivating is the softer option and
 * is usually the right one, because it blocks sign-in while keeping the row for
 * anything that references the person. This is for accounts that should not
 * exist at all.
 *
 * `admin_branch_access` cascades in the schema, so the branch assignments go
 * with it.
 */
export async function deleteStaff(actor: Actor, id: string) {
  assertCanManageStaff(actor);
  const current = await getPrisma().admin_profiles.findUnique({
    where: { id },
    select: { role: true, name: true, admin_branch_access: { select: { location_id: true } } },
  });
  if (!current) throw new NotFoundException("Staff member not found");
  // Deleting your own login would strand you in a session you cannot re-open.
  if (actor.sub === id) throw new BadRequestException("You cannot delete your own account");
  assertCanManageTarget(actor, current.role);
  await assertTargetInScope(actor, current);
  await getPrisma().admin_profiles.delete({ where: { id } });
  logger.info({ staffId: id, by: actor.sub }, "Staff account deleted");
}

export async function replaceStaffBranches(actor: Actor, id: string, branchIds: string[]) {
  assertCanManageStaff(actor);
  const current = await getPrisma().admin_profiles.findUnique({
    where: { id },
    select: { role: true, admin_branch_access: { select: { location_id: true } } },
  });
  if (!current) throw new NotFoundException("Staff member not found");
  assertCanManageTarget(actor, current.role);
  await assertTargetInScope(actor, current);
  if (!isBranchScoped(current.role)) {
    throw new BadRequestException("Branches only apply to branch managers and team members");
  }
  let allowedIds = branchIds;
  if (normalizeRole(actor.role) === "branch_manager") {
    const mine = await actorBranchIds(actor);
    if (branchIds.some((branchId) => !mine.includes(branchId))) throw new ForbiddenException("You can only assign your branches");
    allowedIds = branchIds;
    if (allowedIds.length === 0) throw new ForbiddenException("You can only assign your branch");
  }
  const unique = await existingBranches(allowedIds);
  if (unique.length === 0) {
    throw new BadRequestException("Choose at least one branch");
  }
  await getPrisma().$transaction([
    getPrisma().admin_branch_access.deleteMany({ where: { admin_id: id } }),
    getPrisma().admin_branch_access.createMany({
      data: unique.map((location_id) => ({ admin_id: id, location_id })),
    }),
  ]);
  void invalidateAdminAuth(id);
  return getStaff(actor, id);
}

export async function countStaffByLocation() {
  const rows = await getPrisma().admin_branch_access.groupBy({
    by: ["location_id"],
    _count: { admin_id: true },
  });
  return new Map(rows.map((row) => [row.location_id, row._count.admin_id]));
}
