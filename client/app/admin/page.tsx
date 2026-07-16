"use client";

import StatCard from "@/components/admin/ui/stat-card";
import PageHeader from "@/components/admin/ui/page-header";
import { useOrders } from "@/lib/admin/use-orders";
import { useMenu } from "@/lib/admin/use-menu";

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

export default function AdminDashboard() {
  const { orders } = useOrders();
  const { items } = useMenu();

  const activeOrders = orders.filter(
    (o) => o.status === "pending" || o.status === "preparing" || o.status === "ready"
  );
  const preparingCount = orders.filter((o) => o.status === "preparing").length;
  const readyCount = orders.filter((o) => o.status === "ready").length;

  const stats = [
    {
      title: "Total Orders",
      value: orders.length.toString(),
      change: "+12.5% from last week",
      changeType: "positive" as const,
      icon: (
        <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
        </svg>
      ),
    },
    {
      title: "Revenue",
      value: `£${orders.reduce((sum, o) => sum + o.total, 0).toFixed(0)}`,
      change: "+8.2% from last week",
      changeType: "positive" as const,
      icon: (
        <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
    },
    {
      title: "Active Orders",
      value: activeOrders.length.toString(),
      change: `${preparingCount} preparing, ${readyCount} ready`,
      changeType: "neutral" as const,
      icon: (
        <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
    },
    {
      title: "Menu Items",
      value: items.length.toString(),
      change: "Across 11 categories",
      changeType: "neutral" as const,
      icon: (
        <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
        </svg>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Dashboard"
        description="Welcome back. Here's what's happening today."
      />

      {/* Stats Grid */}
      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <StatCard key={stat.title} {...stat} />
        ))}
      </div>

      {/* Recent Orders */}
      <div className="rounded-xl border border-white/10 bg-white/5">
        <div className="flex items-center justify-between border-b border-white/10 px-6 py-4">
          <h2 className="font-display text-xl tracking-wide text-white">Recent Orders</h2>
          <a
            href="/admin/orders"
            className="text-sm text-brand-red transition-colors hover:text-red-400"
          >
            View all
          </a>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/10 text-left text-xs font-medium uppercase tracking-wider text-white/50">
                <th className="px-6 py-3">Order</th>
                <th className="px-6 py-3">Customer</th>
                <th className="px-6 py-3">Items</th>
                <th className="px-6 py-3">Total</th>
                <th className="px-6 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {orders.slice(0, 5).map((order) => (
                <tr key={order.id} className="transition-colors hover:bg-white/5">
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
                  <td className="px-6 py-4">
                    <span
                      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        statusColors[order.status]
                      }`}
                    >
                      {statusLabels[order.status]}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
