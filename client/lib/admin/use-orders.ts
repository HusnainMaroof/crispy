"use client";

import { useState, useCallback } from "react";
import { api, isSessionExpiredError, type Pagination } from "@/lib/api";

export type AdminOrder = {
  id: string;
  customer: string;
  items: { name: string; quantity: number; price: number }[];
  total: number;
  status: "pending" | "preparing" | "ready" | "out-for-delivery" | "delivered" | "cancelled";
  allowedStatuses: string[];
  fulfilment: string;
  createdAt: string;
  location: string;
  email?: string;
  phone?: string;
  address?: string | null;
  notes?: string | null;
  paymentMethod?: string;
  subtotal?: number;
  deliveryFee?: number;
};

function mapOrder(raw: Record<string, unknown>): AdminOrder {
  const rawItems = (raw.items as Record<string, unknown>[]) ?? [];
  return {
    id: raw.id as string,
    customer: raw.customer_name as string,
    items: mapOrderItems(rawItems),
    total: raw.total as number,
    status: raw.status as AdminOrder["status"],
    allowedStatuses: (raw.allowed_statuses as string[]) ?? [],
    fulfilment: (raw.fulfilment as string) ?? "",
    createdAt: raw.created_at as string,
    location: (raw.location_name as string) || (raw.location_id as string),
    email: raw.email as string | undefined,
    phone: raw.phone as string | undefined,
    address: (raw.address as string | null) ?? null,
    notes: (raw.notes as string | null) ?? null,
    paymentMethod: raw.payment_method as string | undefined,
    subtotal: raw.subtotal as number | undefined,
    deliveryFee: raw.delivery_fee as number | undefined,
  };
}

function mapOrderItems(items: Record<string, unknown>[]): AdminOrder["items"] {
  return items.map((i) => ({
    name: i.name as string,
    quantity: i.quantity as number,
    price: i.price as number,
  }));
}

export type OrderFilters = {
  status?: string;
  location_id?: string;
  fulfilment?: string;
  q?: string;
};

export function useOrders() {
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [pagination, setPagination] = useState<Pagination>({
    page: 1, limit: 20, total: 0, totalPages: 0, hasNextPage: false, hasPreviousPage: false,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  /**
   * Filtering, sorting and paging all happen in the database now. The page
   * renders exactly the rows the server returned, so `total` is the whole
   * collection rather than the length of whatever was downloaded.
   */
  const fetchOrders = useCallback(async (filters?: OrderFilters & { page?: number; limit?: number }) => {
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams();
      if (filters?.status) params.set("status", filters.status);
      if (filters?.location_id) params.set("location_id", filters.location_id);
      if (filters?.fulfilment) params.set("fulfilment", filters.fulfilment);
      if (filters?.q) params.set("q", filters.q);
      if (filters?.page) params.set("page", String(filters.page));
      if (filters?.limit) params.set("limit", String(filters.limit));
      const query = params.toString() ? `?${params.toString()}` : "";
      const { items, pagination: meta } = await api.getPage<Record<string, unknown>>(`/admin/orders${query}`);
      setOrders(items.map(mapOrder));
      setPagination(meta);
    } catch (error) {
      if (isSessionExpiredError(error)) return;
      setError(error instanceof Error ? error.message : "Could not load orders.");
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchOrderById = useCallback(async (id: string): Promise<AdminOrder> => {
    const data = await api.get<{ order: Record<string, unknown>; items: Record<string, unknown>[] }>(
      `/admin/orders/${id}`
    );
    return { ...mapOrder(data.order), items: mapOrderItems(data.items) };
  }, []);

  const updateOrderStatus = useCallback(
    async (id: string, status: AdminOrder["status"]) => {
      const data = await api.patch<Record<string, unknown>>(`/admin/orders/${id}/status`, {
        status,
      });
      // In-place, so a status change does not drop the reader back to page 1
      // or throw away the filters they set.
      setOrders((prev) =>
        prev.map((order) => {
          if (order.id !== id) return order;
          const updated = mapOrder(data);
          return { ...updated, items: updated.items.length > 0 ? updated.items : order.items };
        })
      );
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

  return { orders, pagination, loading, error, fetchOrders, fetchOrderById, updateOrderStatus, getOrder, getOrdersByStatus };
}
