"use client";

import { useState, useCallback } from "react";
import { api } from "@/lib/api";

export type AdminMenuItem = {
  id: string;
  name: string;
  description: string;
  price: string;
  priceValue: number;
  image: string;
  categoryId: string;
  badge?: string;
  badgeVariant?: "default" | "vegan";
};

function mapMenuItem(raw: Record<string, unknown>): AdminMenuItem {
  const price = Number(raw.price) || 0;
  return {
    id: raw.id as string,
    name: raw.name as string,
    description: raw.description as string,
    price: `£${price.toFixed(2)}`,
    priceValue: price,
    image: raw.image as string,
    categoryId: raw.category_id as string,
    badge: (raw.badge as string) ?? undefined,
    badgeVariant: (raw.badge_variant as "default" | "vegan") ?? undefined,
  };
}

export function useMenu() {
  const [items, setItems] = useState<AdminMenuItem[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchItems = useCallback(async (categoryId?: string) => {
    setLoading(true);
    try {
      const query = categoryId ? `?category_id=${categoryId}` : "";
      const data = await api.get<Record<string, unknown>[]>(`/admin/menu${query}`);
      setItems(data.map(mapMenuItem));
    } finally {
      setLoading(false);
    }
  }, []);

  const addItem = useCallback(
    async (item: { name: string; description: string; price?: string; priceValue: number; image: string; categoryId: string; badge?: string; badgeVariant?: "default" | "vegan" }) => {
      const data = await api.post<Record<string, unknown>>("/admin/menu", {
        category_id: item.categoryId,
        name: item.name,
        description: item.description,
        price: item.priceValue,
        image: item.image,
        badge: item.badge ?? null,
        badge_variant: item.badgeVariant ?? null,
        sort_order: 0,
        active: true,
      });
      setItems((prev) => [...prev, mapMenuItem(data)]);
    },
    []
  );

  const updateItem = useCallback(
    async (id: string, updates: { name?: string; description?: string; price?: string; priceValue?: number; image?: string; categoryId?: string; badge?: string; badgeVariant?: "default" | "vegan" }) => {
      const body: Record<string, unknown> = {};
      if (updates.name !== undefined) body.name = updates.name;
      if (updates.description !== undefined) body.description = updates.description;
      if (updates.priceValue !== undefined) body.price = updates.priceValue;
      if (updates.image !== undefined) body.image = updates.image;
      if (updates.categoryId !== undefined) body.category_id = updates.categoryId;
      if (updates.badge !== undefined) body.badge = updates.badge;
      if (updates.badgeVariant !== undefined) body.badge_variant = updates.badgeVariant;
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
