import { getPrisma } from "../config/prisma.js";
import { ForbiddenException } from "../utils/app-error.js";
import type { AuthPayload } from "../types/responses.js";

export type StaffRole = "superadmin" | "admin" | "branch_manager";

/** `null` means every location. An array is the only locations that role may use. */
export function accessibleLocationIds(role: string, assignedLocationIds: string[]): string[] | null {
  if (role === "superadmin" || role === "admin") return null;
  if (role === "branch_manager") return assignedLocationIds;
  return [];
}

export async function getAccessibleLocationIds(admin: Pick<AuthPayload, "sub" | "role">): Promise<string[] | null> {
  if (admin.role === "superadmin" || admin.role === "admin") return null;

  const rows = await getPrisma().admin_branch_access.findMany({
    where: { admin_id: admin.sub },
    select: { location_id: true },
  });
  return accessibleLocationIds(admin.role, rows.map((row) => row.location_id));
}

export async function assertLocationAccess(admin: Pick<AuthPayload, "sub" | "role">, locationId: string): Promise<void> {
  const allowed = await getAccessibleLocationIds(admin);
  if (allowed === null) return;
  if (!allowed.includes(locationId)) {
    throw new ForbiddenException("You do not have access to this branch");
  }
}
