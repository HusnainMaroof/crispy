import { normalizeRole } from "./admin-roles.js";

export const ADMIN_TABS = [
  { id: "dashboard", label: "Dashboard" },
  { id: "menu", label: "Menu" },
  { id: "categories", label: "Categories" },
  { id: "orders", label: "Orders" },
  { id: "customers", label: "Customers" },
  { id: "staff", label: "Staff" },
  { id: "branches", label: "Branches" },
  { id: "deals", label: "Deals" },
  { id: "branch-menu", label: "Branch Menu" },
  { id: "posts", label: "Job Posts" },
  { id: "locations", label: "Locations" },
  { id: "content", label: "Content" },
  { id: "settings", label: "Settings" },
] as const;

export type AdminTabId = (typeof ADMIN_TABS)[number]["id"];

export const ADMIN_TAB_IDS = ADMIN_TABS.map((tab) => tab.id);

// Job posts and applications are per-branch, so a branch manager holds the tab
// and is limited to their own branches by the job controllers.
const MANAGER_TABS: AdminTabId[] = ["dashboard", "orders", "customers", "menu", "branch-menu", "staff", "posts"];
const STAFF_TABS: AdminTabId[] = ["dashboard", "orders", "customers", "menu"];

/**
 * The tabs a role may hold at all. This is the single allow-list; the default
 * seed and the per-request resolution both derive from it, so they cannot
 * disagree the way they did when `tabsForRole` returned 4 tabs for staff while
 * `resolveTabs` allowed 5.
 */
function allowListForRole(role: string): AdminTabId[] {
  const normalized = normalizeRole(role);
  if (normalized === "superadmin") return [...ADMIN_TAB_IDS];
  return normalized === "branch_manager" ? [...MANAGER_TABS] : [...STAFF_TABS, "branch-menu"];
}

export function isAdminTab(value: string): value is AdminTabId {
  return (ADMIN_TAB_IDS as readonly string[]).includes(value);
}

export function tabsForRole(role: string): AdminTabId[] {
  return allowListForRole(role);
}

export function resolveTabs(role: string, stored: readonly string[]): AdminTabId[] {
  const normalized = normalizeRole(role);
  if (normalized === "superadmin") return [...ADMIN_TAB_IDS];
  const tabs = (stored.length > 0 ? stored.filter(isAdminTab) : tabsForRole(normalized));
  return tabs.filter((tab) => allowListForRole(normalized).includes(tab));
}

export function allowedTabsForRole(role: string): AdminTabId[] {
  return allowListForRole(role);
}
