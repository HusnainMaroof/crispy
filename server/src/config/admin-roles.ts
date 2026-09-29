/**
 * Central role policy for the three admin panels:
 *
 *   superadmin      – franchise owner, full control of the /super-admin panel
 *   branch_manager  – runs assigned branches, panel at /{branch}/admin
 *   staff           – works at a branch, panel at /{branch}/{person}
 *
 * Every rule about "who may create or manage whom" lives here so routes,
 * services, and schemas cannot drift apart.
 */

export const ADMIN_ROLES = ["superadmin", "branch_manager", "staff"] as const;

export type AdminRole = (typeof ADMIN_ROLES)[number];

/** Older rows/requests may still carry these; they fold into the canonical set. */
const LEGACY_ROLE_ALIASES: Record<string, AdminRole> = {
  branch_admin: "branch_manager",
  admin: "branch_manager",
};

const ROLE_TIER: Record<AdminRole, number> = {
  superadmin: 4,
  branch_manager: 2,
  staff: 1,
};

export function isAdminRole(value: string): value is AdminRole {
  return (ADMIN_ROLES as readonly string[]).includes(value);
}

/** Map any stored/requested role string onto a canonical role (least privilege on unknown). */
export function normalizeRole(role: string | null | undefined): AdminRole {
  if (!role) return "staff";
  const alias = LEGACY_ROLE_ALIASES[role];
  if (alias) return alias;
  return isAdminRole(role) ? role : "staff";
}

export function roleTier(role: string): number {
  return ROLE_TIER[normalizeRole(role)];
}

/**
 * May an actor with `actorRole` create/edit/manage an account with `targetRole`?
 *
 * The super admin manages everyone. Anyone else may only manage people
 * strictly below their own level, so:
 *   - a branch manager only ever manages staff
 *   - staff never manage anyone
 *   - only the super admin adds branch managers
 */
export function canManageRole(actorRole: string, targetRole: string): boolean {
  const actor = normalizeRole(actorRole);
  if (actor === "superadmin") return true;
  return ROLE_TIER[normalizeRole(targetRole)] < ROLE_TIER[actor];
}

/** Branch managers and staff only ever act inside their assigned branches. */
export function isBranchScoped(role: string): boolean {
  const normalized = normalizeRole(role);
  return normalized === "branch_manager" || normalized === "staff";
}

/** Staff members do not receive the Team area. */
export function isTeamMemberRole(role: string): boolean {
  return normalizeRole(role) === "staff";
}
