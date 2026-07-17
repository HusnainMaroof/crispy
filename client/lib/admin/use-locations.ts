"use client";

import { useState, useCallback } from "react";
import { api } from "@/lib/api";

export type AdminLocation = {
  id: string;
  name: string;
  address: string;
  hours: string;
  phone: string;
};

function mapLocation(raw: Record<string, unknown>): AdminLocation {
  return {
    id: raw.id as string,
    name: raw.name as string,
    address: raw.address as string,
    hours: raw.hours as string,
    phone: raw.phone as string,
  };
}

export function useLocations() {
  const [locations, setLocations] = useState<AdminLocation[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchLocations = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.get<Record<string, unknown>[]>("/admin/locations");
      setLocations(data.map(mapLocation));
    } finally {
      setLoading(false);
    }
  }, []);

  const updateLocation = useCallback(
    async (id: string, updates: Partial<AdminLocation>) => {
      const body: Record<string, unknown> = {};
      if (updates.name !== undefined) body.name = updates.name;
      if (updates.address !== undefined) body.address = updates.address;
      if (updates.hours !== undefined) body.hours = updates.hours;
      if (updates.phone !== undefined) body.phone = updates.phone;
      const data = await api.patch<Record<string, unknown>>(`/admin/locations/${id}`, body);
      const updated = mapLocation(data);
      setLocations((prev) => prev.map((loc) => (loc.id === id ? updated : loc)));
    },
    []
  );

  const addLocation = useCallback(
    async (location: { name: string; address: string; hours: string; phone: string }) => {
      const data = await api.post<Record<string, unknown>>("/admin/locations", {
        name: location.name,
        address: location.address,
        hours: location.hours,
        phone: location.phone,
      });
      setLocations((prev) => [...prev, mapLocation(data)]);
    },
    []
  );

  const deleteLocation = useCallback(async (id: string) => {
    await api.delete(`/admin/locations/${id}`);
    setLocations((prev) => prev.filter((loc) => loc.id !== id));
  }, []);

  return { locations, loading, fetchLocations, addLocation, updateLocation, deleteLocation };
}
