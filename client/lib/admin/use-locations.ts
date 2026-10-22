"use client";

import { useState, useCallback } from "react";
import { api } from "@/lib/api";

export type AdminLocation = {
  id: string;
  name: string;
  address: string;
  hours: string;
  phone: string;
  status: "active" | "inactive";
  sort_order: number;
  /** Manual pin number. Null means the branch uses its list position. */
  pin_number: number | null;
  /** Google Maps link. Empty means the storefront builds one. */
  google_maps_url: string;
};

function mapLocation(raw: Record<string, unknown>): AdminLocation {
  return {
    id: raw.id as string,
    name: raw.name as string,
    address: raw.address as string,
    hours: raw.hours as string,
    phone: raw.phone as string,
    status: raw.status === "inactive" ? "inactive" : "active",
    sort_order: typeof raw.sort_order === "number" ? raw.sort_order : 0,
    pin_number: typeof raw.pin_number === "number" ? raw.pin_number : null,
    google_maps_url: typeof raw.google_maps_url === "string" ? raw.google_maps_url : "",
  };
}

export type BranchInput = {
  name: string;
  address: string;
  hours: string;
  phone: string;
  pin_number?: number | null;
  google_maps_url?: string;
};

export function useLocations() {
  const [locations, setLocations] = useState<AdminLocation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Records the failure instead of rejecting: most callers fire this from a
  // mount effect without a .catch, so a rejected promise became an unhandled
  // rejection and the page silently rendered an empty list.
  const fetchLocations = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await api.get<Record<string, unknown>[]>("/admin/locations");
      setLocations(data.map(mapLocation));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load locations.");
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
      if (updates.status !== undefined) body.status = updates.status;
      if (updates.sort_order !== undefined) body.sort_order = updates.sort_order;
      if (updates.pin_number !== undefined) body.pin_number = updates.pin_number;
      if (updates.google_maps_url !== undefined) body.google_maps_url = updates.google_maps_url;
      const data = await api.patch<Record<string, unknown>>(`/admin/locations/${id}`, body);
      const updated = mapLocation(data);
      setLocations((prev) => prev.map((loc) => (loc.id === id ? updated : loc)));
    },
    []
  );

  const addLocation = useCallback(
    async (location: BranchInput) => {
      const data = await api.post<Record<string, unknown>>("/admin/locations", {
        name: location.name,
        address: location.address,
        hours: location.hours,
        phone: location.phone,
        pin_number: location.pin_number ?? null,
        google_maps_url: location.google_maps_url ?? "",
      });
      setLocations((prev) => [...prev, mapLocation(data)]);
    },
    []
  );

  /**
   * Saves a new branch order in one request. The server returns the list in
   * the saved order, so no extra refetch is needed.
   */
  const reorderLocations = useCallback(async (orderedIds: string[]) => {
    const data = await api.put<Record<string, unknown>[]>("/admin/locations/order", { ids: orderedIds });
    setLocations(data.map(mapLocation));
  }, []);

  const deleteLocation = useCallback(async (id: string) => {
    await api.delete(`/admin/locations/${id}`);
    setLocations((prev) => prev.filter((loc) => loc.id !== id));
  }, []);

  return {
    locations,
    loading,
    error,
    fetchLocations,
    addLocation,
    updateLocation,
    reorderLocations,
    deleteLocation,
  };
}
