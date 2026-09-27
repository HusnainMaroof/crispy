export const ADMIN_TABS = [
  { id: "dashboard", label: "Dashboard", href: "/admin" },
  { id: "orders", label: "Orders", href: "/admin/orders" },
  { id: "customers", label: "Customers", href: "/admin/customers" },
  { id: "menu", label: "Items", href: "/admin/menu" },
  { id: "categories", label: "Categories", href: "/admin/categories" },
  { id: "deals", label: "Deals", href: "/admin/deals" },
  { id: "branch-menu", label: "Per branch", href: "/admin/branch-menu" },
  { id: "locations", label: "Addresses & hours", href: "/admin/locations" },
  { id: "branches", label: "Shop status", href: "/admin/branches" },
  { id: "posts", label: "Jobs", href: "/admin/posts" },
  { id: "staff", label: "Staff", href: "/admin/staff" },
  { id: "content", label: "Content", href: "/admin/cms/home" },
  { id: "settings", label: "Settings", href: "/admin/settings" },
] as const;

export const NAV_SECTIONS: { id: string; label: string; tabIds: AdminTabId[] }[] = [
  { id: "ordering", label: "Ordering", tabIds: ["orders", "customers"] },
  { id: "menu", label: "Menu", tabIds: ["menu", "categories", "deals", "branch-menu"] },
  { id: "branches", label: "Branches", tabIds: ["locations", "branches"] },
  { id: "content", label: "Content", tabIds: ["content"] },
];

export type AdminTabId = (typeof ADMIN_TABS)[number]["id"];

export function adminTab(id: AdminTabId) {
  return ADMIN_TABS.find((tab) => tab.id === id)!;
}

export function visibleTabIds(role: string, tabs: readonly string[]): AdminTabId[] {
  if (role === "superadmin") return ADMIN_TABS.map((tab) => tab.id);
  return ADMIN_TABS.map((tab) => tab.id).filter((id) => tabs.includes(id));
}

export function tabForPath(pathname: string): AdminTabId | null {
  if (pathname === "/admin") return "dashboard";
  if (pathname.startsWith("/admin/cms") || pathname.startsWith("/admin/homepage")) return "content";
  const match = ADMIN_TABS.find((tab) => tab.id !== "dashboard" && tab.id !== "content" && (pathname === tab.href || pathname.startsWith(`${tab.href}/`)));
  return match?.id ?? null;
}
