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

const MANAGER_TABS: AdminTabId[] = ["dashboard", "orders", "customers", "menu", "branch-menu", "staff"];
const STAFF_TABS: AdminTabId[] = ["dashboard", "orders", "customers", "menu"];

export function isAdminTab(value: string): value is AdminTabId {
  return (ADMIN_TAB_IDS as readonly string[]).includes(value);
}

export function tabsForRole(role: string): AdminTabId[] {
  switch (normalizeRole(role)) {
    case "staff":
      return [...STAFF_TABS];
    case "branch_manager":
      return [...MANAGER_TABS];
    default:
      return [...ADMIN_TAB_IDS];
  }
}

export function resolveTabs(role: string, stored: readonly string[]): AdminTabId[] {
  const normalized = normalizeRole(role);
  if (normalized === "superadmin") return [...ADMIN_TAB_IDS];
  const tabs = (stored.length > 0 ? stored.filter(isAdminTab) : tabsForRole(normalized));
  const allowed = normalized === "branch_manager" ? MANAGER_TABS : [...STAFF_TABS, "branch-menu"];
  return tabs.filter((tab) => allowed.includes(tab));
}

export function allowedTabsForRole(role: string): AdminTabId[] {
  const normalized = normalizeRole(role);
  return normalized === "superadmin" ? [...ADMIN_TAB_IDS] : normalized === "branch_manager" ? [...MANAGER_TABS] : [...STAFF_TABS, "branch-menu"];
}
