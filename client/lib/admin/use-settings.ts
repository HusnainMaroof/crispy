"use client";

import { useState, useCallback } from "react";
import { api } from "@/lib/api";

type AdminSettings = {
  deliveryFee: number;
  freeDeliveryThreshold: number;
};

export function useSettings() {
  const [settings, setSettings] = useState<AdminSettings>({
    deliveryFee: 2.99,
    freeDeliveryThreshold: 20,
  });
  const [loading, setLoading] = useState(false);

  const fetchSettings = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.get<Record<string, unknown>>("/admin/settings");
      setSettings({
        deliveryFee: (data.delivery_fee as number) ?? 2.99,
        freeDeliveryThreshold: (data.free_delivery_threshold as number) ?? 20,
      });
    } finally {
      setLoading(false);
    }
  }, []);

  const updateSettings = useCallback(async (updates: Partial<AdminSettings>) => {
    const body: Record<string, unknown> = {};
    if (updates.deliveryFee !== undefined) body.delivery_fee = updates.deliveryFee;
    if (updates.freeDeliveryThreshold !== undefined) body.free_delivery_threshold = updates.freeDeliveryThreshold;
    const data = await api.put<Record<string, unknown>>("/admin/settings", body);
    setSettings({
      deliveryFee: (data.delivery_fee as number) ?? 2.99,
      freeDeliveryThreshold: (data.free_delivery_threshold as number) ?? 20,
    });
  }, []);

  return { settings, loading, fetchSettings, updateSettings };
}
