"use client";

import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { api, clearAuthToken, getAuthToken } from "@/lib/api";
import { visibleTabIds } from "@/lib/admin/tabs";

type AdminUser = { id: string; email: string; name: string; role: string; tabs: string[] };
type Status = "checking" | "guest" | "ready";

type SessionValue = {
  status: Status;
  user: AdminUser | null;
  tabs: string[];
  cmsPages: { id: string; label: string }[];
};

const SessionContext = createContext<SessionValue>({
  status: "checking",
  user: null,
  tabs: [],
  cmsPages: [],
});

export function AdminSessionProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<Status>("checking");
  const [user, setUser] = useState<AdminUser | null>(null);
  const [cmsPages, setCmsPages] = useState<{ id: string; label: string }[]>([]);

  useEffect(() => {
    let active = true;
    if (!getAuthToken()) {
      setStatus("guest");
      return;
    }
    api.get<AdminUser>("/admin/auth/me")
      .then(async (me) => {
        const tabs = visibleTabIds(me.role, me.tabs ?? []);
        const pages = tabs.includes("content")
          ? await api.get<{ id: string; label: string }[]>("/admin/cms/pages").catch(() => [])
          : [];
        if (!active) return;
        setUser({ ...me, tabs });
        setCmsPages(pages);
        setStatus("ready");
      })
      .catch(() => {
        if (!active) return;
        clearAuthToken();
        setStatus("guest");
      });
    return () => { active = false; };
  }, []);

  const value = useMemo<SessionValue>(() => ({
    status,
    user,
    tabs: user?.tabs ?? [],
    cmsPages,
  }), [status, user, cmsPages]);

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useAdminSession() {
  return useContext(SessionContext);
}
