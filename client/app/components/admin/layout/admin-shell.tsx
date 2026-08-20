"use client";

import { useState, useCallback } from "react";
import Sidebar from "./sidebar";
import Topbar from "./topbar";

export default function AdminShell({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

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
      />
      <div className={`transition-all duration-300 ${collapsed ? "lg:pl-20" : "lg:pl-64"}`}>
        <Topbar onToggleSidebar={handleToggleSidebar} />
        <main className="p-4 sm:p-6">{children}</main>
      </div>
    </div>
  );
}
