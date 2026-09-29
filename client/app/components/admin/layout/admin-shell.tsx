"use client";

import { useCallback, useState } from "react";
import { usePathname } from "next/navigation";
import { tabForPath } from "@/lib/admin/tabs";
import { splitPanel } from "@/lib/admin/paths";
import { useAdminSession } from "@/lib/admin/session";
import { PageSkeleton } from "@/app/components/admin/ui/skeleton";
import Sidebar from "./sidebar";
import Topbar from "./topbar";

export default function AdminShell({ children, ready }: { children: React.ReactNode; ready: boolean }) {
  const pathname = usePathname();
  const { tabs, cmsPages } = useAdminSession();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  const { rest } = splitPanel(pathname);
  const needed = tabForPath(rest);
  const allowedHere = rest.startsWith("/menu")
    ? ["menu", "branch-menu"].some((id) => tabs.includes(id))
    : rest.startsWith("/locations") || rest.startsWith("/branches")
      ? ["locations", "branches"].some((id) => tabs.includes(id))
      : needed !== null && tabs.includes(needed);
  const blocked = ready && needed !== null && !allowedHere;

  const handleToggleSidebar = useCallback(() => {
    setSidebarOpen((prev) => !prev);
  }, []);
  const handleCloseSidebar = useCallback(() => {
    setSidebarOpen(false);
  }, []);
  const handleToggleCollapse = useCallback(() => {
    setCollapsed((prev) => !prev);
  }, []);

  return (
    <div className="min-h-screen bg-black">
      <Sidebar
        isOpen={sidebarOpen}
        collapsed={collapsed}
        onClose={handleCloseSidebar}
        onToggleCollapse={handleToggleCollapse}
        allowed={ready ? tabs : null}
        cmsItems={cmsPages.map((page) => ({ href: `${splitPanel(pathname).prefix}/cms/${page.id}`, label: page.label }))}
      />
      <div className={`transition-[padding] duration-300 ${collapsed ? "lg:pl-20" : "lg:pl-64"}`}>
        <Topbar onToggleSidebar={handleToggleSidebar} />
        <main className="p-4 sm:p-6">
          {!ready && <PageSkeleton />}
          {blocked && <p role="alert" className="rounded-xl border border-white/10 bg-white/5 p-6 text-sm text-white/70">This area is not assigned to your account.</p>}
          {ready && !blocked && children}
        </main>
      </div>
    </div>
  );
}
