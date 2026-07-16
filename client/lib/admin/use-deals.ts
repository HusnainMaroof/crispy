"use client";

import { useCallback } from "react";
import { useAdminStore } from "./store";
import type { AdminDeal } from "./mock-data";

export function useDeals() {
  const { deals, setDeals } = useAdminStore();

  const addDeal = useCallback(
    (deal: Omit<AdminDeal, "id">) => {
      const newId = `deal-${Date.now()}`;
      setDeals([...deals, { ...deal, id: newId }]);
    },
    [deals, setDeals]
  );

  const updateDeal = useCallback(
    (id: string, updates: Partial<AdminDeal>) => {
      setDeals(
        deals.map((deal) => (deal.id === id ? { ...deal, ...updates } : deal))
      );
    },
    [deals, setDeals]
  );

  const deleteDeal = useCallback(
    (id: string) => {
      setDeals(deals.filter((deal) => deal.id !== id));
    },
    [deals, setDeals]
  );

  const toggleDealActive = useCallback(
    (id: string) => {
      setDeals(
        deals.map((deal) =>
          deal.id === id ? { ...deal, active: !deal.active } : deal
        )
      );
    },
    [deals, setDeals]
  );

  return { deals, addDeal, updateDeal, deleteDeal, toggleDealActive };
}
