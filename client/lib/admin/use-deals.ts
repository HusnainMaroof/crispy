"use client";

import { useState, useCallback } from "react";
import { api } from "@/lib/api";

export type AdminDeal = {
  id: string;
  name: string;
  description: string;
  price: string;
  priceValue: number;
  image: string;
  badge?: string;
  badgeVariant?: "default" | "vegan";
  active: boolean;
};

function mapDeal(raw: Record<string, unknown>): AdminDeal {
  const price = Number(raw.price) || 0;
  return {
    id: raw.id as string,
    name: raw.name as string,
    description: raw.description as string,
    price: `£${price.toFixed(2)}`,
    priceValue: price,
    image: raw.image as string,
    badge: (raw.badge as string) ?? undefined,
    badgeVariant: (raw.badge_variant as "default" | "vegan") ?? undefined,
    active: raw.active as boolean,
  };
}

export function useDeals() {
  const [deals, setDeals] = useState<AdminDeal[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchDeals = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.get<Record<string, unknown>[]>("/admin/deals");
      setDeals(data.map(mapDeal));
    } finally {
      setLoading(false);
    }
  }, []);

  const addDeal = useCallback(
    async (deal: { name: string; description: string; price?: string; priceValue: number; image: string; badge?: string; badgeVariant?: "default" | "vegan"; active: boolean }) => {
      const data = await api.post<Record<string, unknown>>("/admin/deals", {
        name: deal.name,
        description: deal.description,
        price: deal.priceValue,
        image: deal.image,
        badge: deal.badge ?? null,
        badge_variant: deal.badgeVariant ?? null,
        active: deal.active,
      });
      setDeals((prev) => [...prev, mapDeal(data)]);
    },
    []
  );

  const updateDeal = useCallback(
    async (id: string, updates: { name?: string; description?: string; price?: string; priceValue?: number; image?: string; badge?: string; badgeVariant?: "default" | "vegan"; active?: boolean }) => {
      const body: Record<string, unknown> = {};
      if (updates.name !== undefined) body.name = updates.name;
      if (updates.description !== undefined) body.description = updates.description;
      if (updates.priceValue !== undefined) body.price = updates.priceValue;
      if (updates.image !== undefined) body.image = updates.image;
      if (updates.badge !== undefined) body.badge = updates.badge;
      if (updates.badgeVariant !== undefined) body.badge_variant = updates.badgeVariant;
      if (updates.active !== undefined) body.active = updates.active;
      const data = await api.put<Record<string, unknown>>(`/admin/deals/${id}`, body);
      const updated = mapDeal(data);
      setDeals((prev) => prev.map((deal) => (deal.id === id ? updated : deal)));
    },
    []
  );

  const deleteDeal = useCallback(async (id: string) => {
    await api.delete(`/admin/deals/${id}`);
    setDeals((prev) => prev.filter((deal) => deal.id !== id));
  }, []);

  const toggleDealActive = useCallback(async (id: string) => {
    const data = await api.patch<Record<string, unknown>>(`/admin/deals/${id}/toggle`, {});
    const updated = mapDeal(data);
    setDeals((prev) => prev.map((deal) => (deal.id === id ? updated : deal)));
  }, []);

  return { deals, loading, fetchDeals, addDeal, updateDeal, deleteDeal, toggleDealActive };
}
