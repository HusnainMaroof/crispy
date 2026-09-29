"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { useAdminSession } from "@/lib/admin/session";
import { NAV_SECTIONS, adminTab, tabHref, type AdminTabId } from "@/lib/admin/tabs";
import { splitPanel } from "@/lib/admin/paths";
import { SidebarSkeleton } from "@/app/components/admin/ui/skeleton";

const ICONS: Record<string, (props: { className?: string }) => ReactNode> = {
  dashboard: DashboardIcon,
  ordering: OrdersIcon,
  menu: MenuIcon,
  branches: LocationsIcon,
  content: HomepageIcon,
  posts: PostsIcon,
  staff: StaffIcon,
  settings: SettingsIcon,
};

const SINGLE_TABS: AdminTabId[] = ["dashboard", "posts", "staff"];

type CmsItem = { href: string; label: string };

const bottomNavItems = [
  { id: "settings", segment: "settings", label: "Settings", icon: SettingsIcon },
];

interface SidebarProps {
  isOpen: boolean;
  collapsed: boolean;
  onClose: () => void;
  onToggleCollapse: () => void;
  allowed: string[] | null;
  cmsItems: CmsItem[];
}

export default function Sidebar({ isOpen, collapsed, onClose, onToggleCollapse, allowed, cmsItems }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { prefix } = splitPanel(pathname);
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({});
  const { clearSession, user } = useAdminSession();
  const logoHref = allowed?.includes("dashboard") ? prefix : (user?.home ?? prefix);

  useEffect(() => {
    onClose();
  }, [pathname, onClose]);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  const handleLogout = async () => {
    try {
      await api.logout();
      clearSession();
      router.replace("/super-admin/login");
    } catch {
      // Keep the protected session active if the server could not clear its cookie.
    }
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 z-40 bg-black/60 backdrop-blur-sm transition-opacity duration-300 lg:hidden ${
          isOpen ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
        onClick={onClose}
      />

      {/* Sidebar */}
      <aside
        className={`fixed left-0 top-0 z-50 flex h-screen flex-col border-r border-white/10 bg-black transition-all duration-300 ease-out ${
          collapsed ? "w-20" : "w-64"
        } ${isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}`}
      >
        {/* Logo */}
        <div className="flex h-16 items-center justify-between border-b border-white/10 px-4">
          {!collapsed && (
            <Link href={logoHref} className="font-display text-2xl tracking-wider text-white cursor-pointer">
              CRISP<span className="text-brand-red">IES</span>
            </Link>
          )}
          {collapsed && (
            <Link href={logoHref} className="mx-auto font-display text-lg tracking-wider text-white cursor-pointer">
              <span className="text-brand-red">C</span>
            </Link>
          )}
          <div className="flex items-center gap-1">
            <button
              onClick={onToggleCollapse}
              className="cursor-pointer rounded-lg p-2 text-white/50 transition-colors hover:bg-white/5 hover:text-white"
              title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            >
              {collapsed ? (
                <ChevronRightIcon className="h-4 w-4" />
              ) : (
                <ChevronLeftIcon className="h-4 w-4" />
              )}
            </button>
            <button
              onClick={onClose}
              className="cursor-pointer rounded-lg p-2 text-white/50 transition-colors hover:bg-white/5 hover:text-white lg:hidden"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Main Navigation */}
        <nav className="flex-1 space-y-1 overflow-y-auto p-2" aria-label="Admin">
          {allowed === null && <SidebarSkeleton />}
          {allowed !== null && <>
          {SINGLE_TABS.filter((id) => id === "dashboard" && allowed?.includes(id)).map((id) => (
            <NavLink key={id} href={prefix} label={adminTab(id).label} icon={ICONS.dashboard} active={splitPanel(pathname).rest === "/"} collapsed={collapsed} />
          ))}
          {NAV_SECTIONS.map((section) => {
            if (section.id === "ordering") {
              const first = ["orders", "customers"].find((id) => allowed.includes(id));
              if (!first) return null;
              return <NavLink key="ordering" href={`${prefix}/${first}`} label="Ordering" icon={ICONS.ordering} active={["/orders", "/customers"].some((path) => splitPanel(pathname).rest.startsWith(path))} collapsed={collapsed} />;
            }
            if (section.id === "menu") {
              const canOpenMenu = ["menu", "categories", "branch-menu"].some((id) => allowed?.includes(id));
              if (!canOpenMenu) return null;
              const menuTab = (["menu", "categories", "branch-menu"] as AdminTabId[]).find((id) => allowed.includes(id))!;
              return (
                <NavLink
                  key={section.id}
                  href={tabHref(prefix, menuTab)}
                  label="Menu"
                  icon={ICONS.menu}
                  active={["/menu", "/categories", "/branch-menu"].some((path) => splitPanel(pathname).rest === path || splitPanel(pathname).rest.startsWith(`${path}/`))}
                  collapsed={collapsed}
                />
              );
            }
            if (section.id === "branches") {
              const canOpenBranches = ["locations", "branches"].some((id) => allowed?.includes(id));
              if (!canOpenBranches) return null;
              const branchTab = allowed.includes("locations") ? "locations" : "branches";
              return (
                <NavLink
                  key={section.id}
                  href={tabHref(prefix, branchTab)}
                  label="Branches"
                  icon={ICONS.branches}
                  active={["/locations", "/branches"].some((path) => splitPanel(pathname).rest === path || splitPanel(pathname).rest.startsWith(`${path}/`))}
                  collapsed={collapsed}
                />
              );
            }
            const children = section.id === "content"
              ? (allowed?.includes("content") ? cmsItems : [])
              : section.tabIds.filter((id) => allowed?.includes(id)).map((id) => ({ href: tabHref(prefix, id), label: adminTab(id).label })).filter((item, index, list) => list.findIndex((entry) => entry.href === item.href) === index);
            if (children.length === 0) return null;
            const active = children.some((item) => pathname === item.href || pathname.startsWith(`${item.href}/`));
            const expanded = collapsed ? false : (openGroups[section.id] ?? active);
            const Icon = ICONS[section.id] ?? MenuIcon;
            return (
              <div key={section.id}>
                <button
                  type="button"
                  aria-expanded={expanded}
                  title={collapsed ? section.label : undefined}
                  onClick={() => {
                    if (collapsed) {
                      onToggleCollapse();
                      setOpenGroups((current) => ({ ...current, [section.id]: true }));
                      return;
                    }
                    setOpenGroups((current) => ({ ...current, [section.id]: !expanded }));
                  }}
                  className={`flex min-h-11 w-full cursor-pointer items-center gap-3 rounded-lg px-3 text-sm font-medium focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#FF0931] ${
                    collapsed ? "justify-center" : ""
                  } ${active ? "text-white" : "text-white/50 hover:bg-white/5 hover:text-white"}`}
                >
                  <Icon className="h-5 w-5 shrink-0" />
                  {!collapsed && <span className="flex-1 text-left">{section.label}</span>}
                  {!collapsed && <ChevronRightIcon className={`h-4 w-4 transition-transform duration-200 ${expanded ? "rotate-90" : ""}`} />}
                </button>
                {expanded && (
                  <div className="ml-5 mt-1 space-y-1 border-l border-white/10 pl-2">
                    {children.map((item) => {
                      const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
                      return (
                        <Link
                          key={item.href}
                          href={item.href}
                          aria-current={isActive ? "page" : undefined}
                          className={`flex min-h-11 items-center rounded-lg px-3 text-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#FF0931] ${
                            isActive ? "bg-[#FF0931] text-white" : "text-white/60 hover:bg-white/5 hover:text-white"
                          }`}
                        >
                          {item.label}
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
          {SINGLE_TABS.filter((id) => id !== "dashboard" && allowed?.includes(id)).map((id) => {
            const tab = adminTab(id);
            return (
              <NavLink
                key={id}
                href={tabHref(prefix, id)}
                label={tab.label}
                icon={ICONS[id]}
                active={pathname === tabHref(prefix, id) || pathname.startsWith(`${tabHref(prefix, id)}/`)}
                collapsed={collapsed}
              />
            );
          })}
          </>}
        </nav>

        {/* Bottom Section */}
        <div className="border-t border-white/10 p-2 space-y-1">
          {bottomNavItems.filter((item) => allowed?.includes(item.id)).map((item) => {
            const href = `${prefix}/${item.segment}`;
            const isActive = pathname === href || pathname.startsWith(`${href}/`);
            return (
              <Link
                key={item.id}
                href={href}
                title={collapsed ? item.label : undefined}
                className={`group flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200 ${
                  collapsed ? "justify-center" : ""
                } ${
                  isActive
                    ? "bg-brand-red text-white shadow-lg shadow-brand-red/20"
                    : "text-white/50 hover:bg-white/5 hover:text-white"
                }`}
              >
                <item.icon
                  className={`h-5 w-5 shrink-0 transition-transform duration-200 group-hover:scale-110 ${
                    isActive ? "text-white" : "text-white/50 group-hover:text-white"
                  }`}
                />
                {!collapsed && <span>{item.label}</span>}
              </Link>
            );
          })}

          {/* Logout */}
          <button
            onClick={handleLogout}
            title={collapsed ? "Sign out" : undefined}
            className={`cursor-pointer flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-white/50 transition-all duration-200 hover:bg-red-500/10 hover:text-red-400 ${
              collapsed ? "justify-center" : ""
            }`}
          >
            <LogoutIcon className="h-5 w-5 shrink-0" />
            {!collapsed && <span>Sign out</span>}
          </button>
        </div>
      </aside>
    </>
  );
}

function NavLink({ href, label, icon: Icon, active, collapsed }: { href: string; label: string; icon: (props: { className?: string }) => ReactNode; active: boolean; collapsed: boolean }) {
  return (
    <Link
      href={href}
      title={collapsed ? label : undefined}
      aria-current={active ? "page" : undefined}
      className={`group flex min-h-11 cursor-pointer items-center gap-3 rounded-lg px-3 text-sm font-medium focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#FF0931] ${
        collapsed ? "justify-center" : ""
      } ${active ? "bg-brand-red text-white shadow-lg shadow-brand-red/20" : "text-white/50 hover:bg-white/5 hover:text-white"}`}
    >
      <Icon className="h-5 w-5 shrink-0" />
      {!collapsed && <span>{label}</span>}
    </Link>
  );
}

function DashboardIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
    </svg>
  );
}

function MenuIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
    </svg>
  );
}

function OrdersIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
    </svg>
  );
}

function HomepageIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l9-9 9 9M5 10v10h14V10" />
    </svg>
  );
}

function StaffIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
    </svg>
  );
}

function PostsIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
    </svg>
  );
}

function LocationsIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  );
}

function SettingsIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  );
}

function LogoutIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
    </svg>
  );
}

function ChevronLeftIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
    </svg>
  );
}

function ChevronRightIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
    </svg>
  );
}
