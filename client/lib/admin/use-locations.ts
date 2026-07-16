"use client";

import { useCallback } from "react";
import { useAdminStore } from "./store";
import type { AdminLocation } from "./mock-data";

export function useLocations() {
  const { locations, setLocations } = useAdminStore();

  const updateLocation = useCallback(
    (index: number, updates: Partial<AdminLocation>) => {
      setLocations(
        locations.map((loc, i) => (i === index ? { ...loc, ...updates } : loc))
      );
    },
    [locations, setLocations]
  );

  return { locations, updateLocation };
}
