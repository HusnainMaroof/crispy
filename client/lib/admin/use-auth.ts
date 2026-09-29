"use client";

import { useState, useCallback } from "react";
import { api } from "@/lib/api";

type AdminUser = {
  id: string;
  email: string;
  name: string;
  role: string;
  tabs: string[];
  home?: string;
};

export function useAuth() {
  const [user, setUser] = useState<AdminUser | null>(null);
  const [loading, setLoading] = useState(false);

  const login = useCallback(async (email: string, password: string) => {
    setLoading(true);
    try {
      const data = await api.post<{ user: AdminUser }>(
        "/admin/auth/login",
        { email, password }
      );
      setUser(data.user);
      return data.user;
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    await api.logout();
    setUser(null);
  }, []);

  return { user, loading, login, logout };
}
