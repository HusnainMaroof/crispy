"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { api } from "@/lib/api";
import { visibleTabIds } from "@/lib/admin/tabs";

type AdminUser = {
  id: string;
  email: string;
  name: string;
  role: string;
  tabs: string[];
  home?: string;
  branches?: { id: string; name: string; slug: string }[];
};
type Status = "checking" | "guest" | "ready";

type SessionValue = {
  status: Status;
  user: AdminUser | null;
  tabs: string[];
  cmsPages: { id: string; label: string }[];
  refreshSession: (showChecking?: boolean) => Promise<AdminUser | null>;
  acceptSession: (user: AdminUser) => AdminUser;
  clearSession: () => void;
};

const SessionContext = createContext<SessionValue>({
  status: "checking",
  user: null,
  tabs: [],
  cmsPages: [],
  refreshSession: async () => null,
  acceptSession: (user) => user,
  clearSession: () => {},
});

export function AdminSessionProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<Status>("checking");
  const [user, setUser] = useState<AdminUser | null>(null);
  const [cmsPages, setCmsPages] = useState<{ id: string; label: string }[]>([]);
  const sessionRequestId = useRef(0);

  const refreshSession = useCallback(async (showChecking = false) => {
    const requestId = ++sessionRequestId.current;
    if (showChecking) setStatus("checking");
    try {
      const me = await api.get<AdminUser>("/admin/auth/me");
      const tabs = visibleTabIds(me.role, me.tabs ?? []);
      const pages = tabs.includes("content")
        ? await api.get<{ id: string; label: string }[]>("/admin/cms/pages").catch(() => [])
        : [];
      if (requestId !== sessionRequestId.current) return null;
      const nextUser = { ...me, tabs };
      setUser(nextUser);
      setCmsPages(pages);
      setStatus("ready");
      return nextUser;
    } catch {
      if (requestId !== sessionRequestId.current) return null;
      // Any failure to confirm the session (401, 502 from the admin proxy, 429,
      // a non-JSON body, offline) leaves us unable to prove the user is signed
      // in, so we send them to the login screen. Keeping the old behaviour of
      // stranding them on a dead end just produced an unreachable-looking
      // "Could not reach the server" page instead of the login form.
      setUser(null);
      setCmsPages([]);
      setStatus("guest");
      return null;
    }
  }, []);

  const acceptSession = useCallback((profile: AdminUser) => {
    sessionRequestId.current += 1;
    const nextUser = { ...profile, tabs: visibleTabIds(profile.role, profile.tabs ?? []) };
    setUser(nextUser);
    setStatus("ready");
    setCmsPages([]);
    if (nextUser.tabs.includes("content")) {
      const requestId = sessionRequestId.current;
      void api.get<{ id: string; label: string }[]>("/admin/cms/pages")
        .then((pages) => {
          if (requestId === sessionRequestId.current) setCmsPages(pages);
        })
        .catch(() => {});
    }
    return nextUser;
  }, []);

  const clearSession = useCallback(() => {
    sessionRequestId.current += 1;
    setUser(null);
    setCmsPages([]);
    setStatus("guest");
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void refreshSession(true);
    }, 0);
    const handleExpired = () => clearSession();
    window.addEventListener("admin-session-expired", handleExpired);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener("admin-session-expired", handleExpired);
    };
  }, [refreshSession, clearSession]);

  const value = useMemo<SessionValue>(() => ({
    status,
    user,
    tabs: user?.tabs ?? [],
    cmsPages,
    refreshSession,
    acceptSession,
    clearSession,
  }), [status, user, cmsPages, refreshSession, acceptSession, clearSession]);

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useAdminSession() {
  return useContext(SessionContext);
}
