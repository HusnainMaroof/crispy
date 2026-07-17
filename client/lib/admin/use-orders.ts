"use client";

import { useState, useCallback } from "react";
import { api } from "@/lib/api";

export type AdminOrder = {
  id: string;
  customer: string;
  items: { name: string; quantity: number; price: number }[];
  total: number;
  status: "pending" | "preparing" | "ready" | "out-for-delivery" | "delivered" | "cancelled";
  createdAt: string;
  location: string;
};

function mapOrder(raw: Record<string, unknown>): AdminOrder {
  return {
    id: raw.id as string,
    customer: raw.customer_name as string,
    items: ((raw.items as Record<string, unknown>[]) ?? []).map((i) => ({
      name: i.name as string,
      quantity: i.quantity as number,
      price: i.price as number,
    })),
    total: raw.total as number,
    status: raw.status as AdminOrder["status"],
    createdAt: raw.created_at as string,
    location: raw.location_id as string,
  };
}

export function useOrders() {
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchOrders = useCallback(async (filters?: { status?: string; location_id?: string }) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filters?.status) params.set("status", filters.status);
      if (filters?.location_id) params.set("location_id", filters.location_id);
      const query = params.toString() ? `?${params.toString()}` : "";
      const data = await api.get<Record<string, unknown>[]>(`/admin/orders${query}`);
      setOrders(data.map(mapOrder));
    } finally {
      setLoading(false);
    }
  }, []);

  const updateOrderStatus = useCallback(
    async (id: string, status: AdminOrder["status"]) => {
      const data = await api.patch<Record<string, unknown>>(`/admin/orders/${id}/status`, {
        status,
      });
      const updated = mapOrder(data);
      setOrders((prev) => prev.map((order) => (order.id === id ? updated : order)));
    },
    []
  );

  const getOrder = useCallback(
    (id: string) => orders.find((order) => order.id === id),
    [orders]
  );

  const getOrdersByStatus = useCallback(
    (status: AdminOrder["status"]) => orders.filter((order) => order.status === status),
    [orders]
  );

  return { orders, loading, fetchOrders, updateOrderStatus, getOrder, getOrdersByStatus };
}
