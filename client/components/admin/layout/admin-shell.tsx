"use client";

import { useState, useCallback } from "react";
import Sidebar from "./sidebar";
import Topbar from "./topbar";

export default function AdminShell({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleToggleSidebar = useCallback(() => {
    setSidebarOpen((prev) => !prev);
  }, []);

  const handleCloseSidebar = useCallback(() => {
    setSidebarOpen(false);
  }, []);

  return (
    <div className="min-h-screen bg-black">
      <Sidebar isOpen={sidebarOpen} onClose={handleCloseSidebar} />
      <div className="transition-all duration-300 lg:pl-64">
        <Topbar onToggleSidebar={handleToggleSidebar} />
        <main className="p-4 sm:p-6">{children}</main>
      </div>
    </div>
  );
}
