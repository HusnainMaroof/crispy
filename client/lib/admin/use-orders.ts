"use client";

import { useCallback } from "react";
import { useAdminStore } from "./store";
import type { AdminOrder } from "./mock-data";

export function useOrders() {
  const { orders, setOrders } = useAdminStore();

  const updateOrderStatus = useCallback(
    (id: string, status: AdminOrder["status"]) => {
      setOrders(
        orders.map((order) => (order.id === id ? { ...order, status } : order))
      );
    },
    [orders, setOrders]
  );

  const getOrder = useCallback(
    (id: string) => orders.find((order) => order.id === id),
    [orders]
  );

  const getOrdersByStatus = useCallback(
    (status: AdminOrder["status"]) => orders.filter((order) => order.status === status),
    [orders]
  );

  return { orders, updateOrderStatus, getOrder, getOrdersByStatus };
}
