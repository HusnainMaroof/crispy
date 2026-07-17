"use client";

import { useEffect, useState } from "react";
import PageHeader from "@/components/admin/ui/page-header";
import Dropdown from "@/components/admin/ui/dropdown";
import { TableSkeleton } from "@/components/admin/ui/skeleton";
import { useOrders } from "@/lib/admin/use-orders";
import type { AdminOrder } from "@/lib/admin/use-orders";

const statusColors: Record<string, string> = {
  pending: "bg-yellow-500/20 text-yellow-400",
  preparing: "bg-blue-500/20 text-blue-400",
  ready: "bg-green-500/20 text-green-400",
  delivered: "bg-white/10 text-white/50",
  cancelled: "bg-red-500/20 text-red-400",
};

const statusLabels: Record<string, string> = {
  pending: "Pending",
  preparing: "Preparing",
  ready: "Ready",
  delivered: "Delivered",
  cancelled: "Cancelled",
};

const statusOptions = [
  { value: "pending", label: "Pending" },
  { value: "preparing", label: "Preparing" },
  { value: "ready", label: "Ready" },
  { value: "delivered", label: "Delivered" },
  { value: "cancelled", label: "Cancelled" },
];

const filterOptions = [
  { value: "all", label: "All Orders" },
  { value: "pending", label: "Pending" },
  { value: "preparing", label: "Preparing" },
  { value: "ready", label: "Ready" },
  { value: "delivered", label: "Delivered" },
  { value: "cancelled", label: "Cancelled" },
];

export default function OrdersPage() {
  const { orders, loading, fetchOrders, updateOrderStatus } = useOrders();
  const [filterStatus, setFilterStatus] = useState<string>("all");

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const filtered = orders.filter(
    (order) => filterStatus === "all" || order.status === filterStatus
  );

  const handleStatusChange = (orderId: string, newStatus: string) => {
    updateOrderStatus(orderId, newStatus as AdminOrder["status"]);
  };

  return (
    <div className="admin-fade-in">
      <PageHeader
        title="Orders"
        description="View and manage customer orders."
      />

      {loading && <TableSkeleton />}

      {/* Status Filter */}
      <div className="mb-6">
        <Dropdown
          options={filterOptions}
          value={filterStatus}
          onChange={setFilterStatus}
          placeholder="Filter by status"
          className="w-48"
        />
      </div>

      {/* Orders Table */}
      <div className="overflow-x-auto rounded-xl border border-white/10 bg-white/5">
        <table className="w-full">
          <thead>
            <tr className="border-b border-white/10 text-left text-xs font-medium uppercase tracking-wider text-white/50">
              <th className="px-6 py-3">Order</th>
              <th className="px-6 py-3">Customer</th>
              <th className="px-6 py-3">Items</th>
              <th className="px-6 py-3">Total</th>
              <th className="px-6 py-3">Location</th>
              <th className="px-6 py-3">Status</th>
              <th className="px-6 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {filtered.map((order, index) => (
              <tr
                key={order.id}
                className="transition-colors hover:bg-white/5 admin-slide-up"
                style={{ animationDelay: `${index * 30}ms` }}
              >
                <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-white">
                  {order.id}
                </td>
                <td className="whitespace-nowrap px-6 py-4 text-sm text-white/70">
                  {order.customer}
                </td>
                <td className="max-w-xs truncate px-6 py-4 text-sm text-white/70">
                  {order.items.map((item) => `${item.quantity}x ${item.name}`).join(", ")}
                </td>
                <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-white">
                  £{order.total.toFixed(2)}
                </td>
                <td className="whitespace-nowrap px-6 py-4 text-sm text-white/70">
                  {order.location}
                </td>
                <td className="px-6 py-4">
                  <span
                    className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                      statusColors[order.status]
                    }`}
                  >
                    {statusLabels[order.status]}
                  </span>
                </td>
                <td className="px-6 py-4 text-right">
                  <Dropdown
                    options={statusOptions}
                    value={order.status}
                    onChange={(value) => handleStatusChange(order.id, value)}
                    className="w-32"
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <div className="py-12 text-center text-sm text-white/50">
            No orders found matching your criteria.
          </div>
        )}
      </div>
    </div>
  );
}
