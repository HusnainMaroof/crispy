"use client";

import { useCallback } from "react";
import { useAdminStore } from "./store";
import type { AdminSettings } from "./mock-data";

export function useSettings() {
  const { settings, setSettings } = useAdminStore();

  const updateSettings = useCallback(
    (updates: Partial<AdminSettings>) => {
      setSettings({ ...settings, ...updates });
    },
    [settings, setSettings]
  );

  return { settings, updateSettings };
}
