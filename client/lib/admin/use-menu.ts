"use client";

import { useState, useCallback } from "react";
import { api, isSessionExpiredError } from "@/lib/api";

export type AdminMenuItem = {
  id: string;
  name: string;
  nameAr?: string;
  description: string;
  descriptionAr?: string;
  price: string;
  priceValue: number;
  image: string;
  categoryId: string;
  badge?: string;
  badgeVariant?: "default" | "vegan";
  redirectUrl?: string;
  locations: { id: string; name: string }[];
};

function mapMenuItem(raw: Record<string, unknown>): AdminMenuItem {
  const price = Number(raw.price) || 0;
  return {
    id: raw.id as string,
    name: raw.name as string,
    nameAr: (raw.name_ar as string) ?? undefined,
    description: raw.description as string,
    descriptionAr: (raw.description_ar as string) ?? undefined,
    price: `£${price.toFixed(2)}`,
    priceValue: price,
    image: raw.image as string,
    categoryId: raw.category_id as string,
    badge: (raw.badge as string) ?? undefined,
    badgeVariant: (raw.badge_variant as "default" | "vegan") ?? undefined,
    redirectUrl: (raw.redirect_url as string) ?? undefined,
    locations: Array.isArray(raw.locations)
      ? raw.locations.map((location) => {
          const row = location as Record<string, unknown>;
          return { id: String(row.id), name: String(row.name) };
        })
      : [],
  };
}

export function useMenu() {
  const [items, setItems] = useState<AdminMenuItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchItems = useCallback(async (categoryId?: string) => {
    setLoading(true);
    try {
      const query = categoryId ? `?category_id=${categoryId}` : "";
      const data = await api.get<Record<string, unknown>[]>(`/admin/menu${query}`);
      setItems(data.map(mapMenuItem));
    } catch (error) {
      if (!isSessionExpiredError(error)) throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  const addItem = useCallback(
    async (item: { name: string; nameAr?: string; description: string; descriptionAr?: string; price?: string; priceValue: number; image: string; categoryId: string; badge?: string | null; badgeVariant?: "default" | "vegan" | null; redirectUrl?: string; locationIds: string[] }) => {
      const data = await api.post<Record<string, unknown>>("/admin/menu", {
        category_id: item.categoryId,
        name: item.name,
        name_ar: item.nameAr ?? "",
        description: item.description,
        description_ar: item.descriptionAr ?? "",
        price: item.priceValue,
        image: item.image,
        badge: item.badge ?? null,
        badge_variant: item.badgeVariant ?? null,
        redirect_url: item.redirectUrl ?? "",
        sort_order: 0,
        active: true,
        location_ids: item.locationIds,
      });
      const created = mapMenuItem(data);
      setItems((prev) => [...prev, created]);
      return created;
    },
    []
  );

  const updateItem = useCallback(
    async (id: string, updates: { name?: string; nameAr?: string; description?: string; descriptionAr?: string; price?: string; priceValue?: number; image?: string; categoryId?: string; badge?: string | null; badgeVariant?: "default" | "vegan" | null; redirectUrl?: string; locationIds?: string[] }) => {
      const body: Record<string, unknown> = {};
      if (updates.name !== undefined) body.name = updates.name;
      if (updates.nameAr !== undefined) body.name_ar = updates.nameAr;
      if (updates.description !== undefined) body.description = updates.description;
      if (updates.descriptionAr !== undefined) body.description_ar = updates.descriptionAr;
      if (updates.priceValue !== undefined) body.price = updates.priceValue;
      if (updates.image !== undefined) body.image = updates.image;
      if (updates.categoryId !== undefined) body.category_id = updates.categoryId;
      if (updates.badge !== undefined) body.badge = updates.badge;
      if (updates.badgeVariant !== undefined) body.badge_variant = updates.badgeVariant;
      if (updates.redirectUrl !== undefined) body.redirect_url = updates.redirectUrl;
      if (updates.locationIds !== undefined) body.location_ids = updates.locationIds;
      const data = await api.put<Record<string, unknown>>(`/admin/menu/${id}`, body);
      const updated = mapMenuItem(data);
      setItems((prev) => prev.map((item) => (item.id === id ? updated : item)));
    },
    []
  );

  const deleteItem = useCallback(async (id: string) => {
    await api.delete(`/admin/menu/${id}`);
    setItems((prev) => prev.filter((item) => item.id !== id));
  }, []);

  const getItem = useCallback(
    (id: string) => items.find((item) => item.id === id),
    [items]
  );

  return { items, loading, fetchItems, addItem, updateItem, deleteItem, getItem };
}
