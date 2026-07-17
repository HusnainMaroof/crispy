"use client";

import { useState, useCallback } from "react";
import { api, setAuthToken, clearAuthToken, getAuthToken } from "@/lib/api";

type AdminUser = {
  id: string;
  email: string;
  name: string;
  role: string;
};

export function useAuth() {
  const [user, setUser] = useState<AdminUser | null>(null);
  const [loading, setLoading] = useState(false);

  const login = useCallback(async (email: string, password: string) => {
    setLoading(true);
    try {
      const data = await api.post<{ token: string; user: AdminUser }>(
        "/admin/auth/login",
        { email, password }
      );
      setAuthToken(data.token);
      setUser(data.user);
      return data.user;
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(() => {
    clearAuthToken();
    setUser(null);
  }, []);

  const checkSession = useCallback(async () => {
    const token = getAuthToken();
    if (!token) return null;
    try {
      const data = await api.get<AdminUser>("/admin/auth/me");
      setUser(data);
      return data;
    } catch {
      clearAuthToken();
      return null;
    }
  }, []);

  return { user, loading, login, logout, checkSession };
}
