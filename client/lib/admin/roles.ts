/**
 * Client-side mirror of the server role policy (server/src/config/admin-roles.ts),
 * used only to shape the Team UI — the server enforces the same rules.
 */

export type AdminRole = "superadmin" | "branch_manager" | "staff";

const ROLE_TIER: Record<AdminRole, number> = {
  superadmin: 4,
  branch_manager: 2,
  staff: 1,
};

export function normalizeRole(role: string | null | undefined): AdminRole {
  if (role === "superadmin" || role === "branch_manager" || role === "staff") return role;
  if (role === "branch_admin" || role === "admin") return "branch_manager";
  return "staff";
}

export function canManageRole(actorRole: string, targetRole: string): boolean {
  const actor = normalizeRole(actorRole);
  if (actor === "superadmin") return true;
  return ROLE_TIER[normalizeRole(targetRole)] < ROLE_TIER[actor];
}

export function isBranchScoped(role: string): boolean {
  return normalizeRole(role) === "branch_manager" || normalizeRole(role) === "staff";
}

/** Team members (staff panel) never see the Team area. */
export function isTeamMember(role: string): boolean {
  return normalizeRole(role) === "staff";
}

export const ROLE_LABELS: Record<AdminRole, string> = {
  superadmin: "Super admin",
  branch_manager: "Branch manager",
  staff: "Staff member",
};

export function roleLabel(role: string): string {
  return ROLE_LABELS[normalizeRole(role)];
}

export const ROLE_ACCESS: Record<AdminRole, string[]> = {
  superadmin: ["dashboard", "orders", "customers", "menu", "categories", "deals", "branch-menu", "branches", "locations", "posts", "staff", "content", "settings"],
  // Job posts and applications are per-branch, so a branch manager gets the tab
  // and is limited to their own branches by the server.
  branch_manager: ["dashboard", "orders", "customers", "menu", "branch-menu", "staff", "posts"],
  staff: ["dashboard", "orders", "customers", "menu", "branch-menu"],
};
export const ROLE_DEFAULTS: Record<AdminRole, string[]> = { ...ROLE_ACCESS, staff: ["dashboard", "orders", "customers", "menu"] };
export const STAFF_POSITIONS = ["Cashier", "Kitchen staff", "Shift supervisor", "Delivery staff", "Customer service"];

/**
 * Roles the actor may assign in the Team UI. Super admin accounts are
 * provisioned separately (the franchise owner stays the only super admin).
 */
export function assignableRoles(actorRole: string): AdminRole[] {
  switch (normalizeRole(actorRole)) {
    case "superadmin":
      return ["branch_manager", "staff"];
    default:
      return ["staff"];
  }
}
