import { normalizeRole, ROLE_ACCESS } from "./roles";

export const ADMIN_TABS = [
  { id: "dashboard", label: "Dashboard", segment: "" },
  { id: "orders", label: "Orders", segment: "orders" },
  { id: "customers", label: "Customers", segment: "customers" },
  { id: "menu", label: "Menu", segment: "menu" },
  { id: "categories", label: "Menu", segment: "menu" },
  { id: "deals", label: "Deals", segment: "deals" },
  { id: "branch-menu", label: "Per branch", segment: "branch-menu" },
  { id: "locations", label: "Branches", segment: "locations" },
  { id: "branches", label: "Branches", segment: "locations" },
  { id: "posts", label: "Jobs", segment: "posts" },
  { id: "staff", label: "Team", segment: "staff" },
  { id: "content", label: "Content", segment: "cms/home" },
  { id: "settings", label: "Settings", segment: "settings" },
] as const;

export const NAV_SECTIONS: { id: string; label: string; tabIds: AdminTabId[] }[] = [
  { id: "ordering", label: "Ordering", tabIds: ["orders", "customers"] },
  { id: "menu", label: "Menu", tabIds: ["menu"] },
  { id: "branches", label: "Branches", tabIds: ["locations"] },
  { id: "content", label: "Content", tabIds: ["content"] },
];

export type AdminTabId = (typeof ADMIN_TABS)[number]["id"];

export function adminTab(id: AdminTabId) {
  return ADMIN_TABS.find((tab) => tab.id === id)!;
}

export function tabHref(prefix: string, id: AdminTabId) {
  const segment = adminTab(id).segment;
  return segment ? `${prefix}/${segment}` : prefix;
}

export function defaultAdminPath(tabs: readonly string[], prefix = "/super-admin"): string {
  if (tabs.includes("dashboard")) return prefix;
  const firstTab = ADMIN_TABS.find((tab) => tabs.includes(tab.id));
  return firstTab ? tabHref(prefix, firstTab.id) : prefix;
}

export function visibleTabIds(role: string, tabs: readonly string[]): AdminTabId[] {
  const normalized = normalizeRole(role);
  if (normalized === "superadmin") return ADMIN_TABS.map((tab) => tab.id);
  const allowed = ADMIN_TABS.map((tab) => tab.id).filter((id) => tabs.includes(id));
  // A team member (staff panel) never sees the Team area.
  return allowed.filter((id) => ROLE_ACCESS[normalized].includes(id));
}

export const TAB_PICKER_LABELS: Record<AdminTabId, string> = {
  dashboard: "Dashboard",
  orders: "Orders",
  customers: "Customers",
  menu: "Menu",
  categories: "Categories",
  deals: "Deals",
  "branch-menu": "Per-branch menu",
  branches: "Branches",
  locations: "Locations",
  content: "Content",
  posts: "Jobs",
  staff: "Team",
  settings: "Settings",
};

/** Every tab exactly once, grouped for the flexible access picker. */
export const TAB_PICKER_GROUPS: { label: string; tabIds: AdminTabId[] }[] = [
  { label: "Overview", tabIds: ["dashboard", "settings"] },
  { label: "Ordering", tabIds: ["orders", "customers"] },
  { label: "Menu", tabIds: ["menu", "categories", "deals", "branch-menu"] },
  { label: "Branches", tabIds: ["branches", "locations"] },
  { label: "Content & jobs", tabIds: ["content", "posts"] },
  { label: "Team", tabIds: ["staff"] },
];

export function tabForPath(pathname: string): AdminTabId | null {
  const rest = pathname.replace(/\/$/, "") || "/";
  if (rest === "/" || rest === "") return "dashboard";
  if (rest.startsWith("/cms") || rest.startsWith("/homepage")) return "content";
  const match = ADMIN_TABS.find((tab) => tab.segment && (rest === `/${tab.segment}` || rest.startsWith(`/${tab.segment}/`)));
  return match?.id ?? null;
}
