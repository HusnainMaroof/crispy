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

const MANAGER_TABS: AdminTabId[] = ["dashboard", "orders", "customers", "branch-menu"];

export function isAdminTab(value: string): value is AdminTabId {
  return (ADMIN_TAB_IDS as readonly string[]).includes(value);
}

export function tabsForRole(role: string): AdminTabId[] {
  if (role === "branch_manager") return [...MANAGER_TABS];
  return [...ADMIN_TAB_IDS];
}

export function resolveTabs(role: string, stored: readonly string[]): AdminTabId[] {
  if (role === "superadmin") return [...ADMIN_TAB_IDS];
  return stored.filter(isAdminTab);
}
