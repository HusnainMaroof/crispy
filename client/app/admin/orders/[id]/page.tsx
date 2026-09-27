"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import toast from "react-hot-toast";
import PageHeader from "@/app/components/admin/ui/page-header";
import Dropdown from "@/app/components/admin/ui/dropdown";
import { useOrders } from "@/lib/admin/use-orders";
import type { AdminOrder } from "@/lib/admin/use-orders";

const labels: Record<string, string> = {
  pending: "Pending",
  preparing: "Preparing",
  ready: "Ready",
  "out-for-delivery": "Out for Delivery",
  delivered: "Delivered",
  cancelled: "Cancelled",
};

export default function OrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { fetchOrderById, updateOrderStatus } = useOrders();
  const [order, setOrder] = useState<AdminOrder | null>(null);
  const [id, setId] = useState("");

  useEffect(() => {
    void params.then((value) => setId(value.id));
  }, [params]);

  useEffect(() => {
    if (!id) return;
    fetchOrderById(id).then(setOrder).catch(() => toast.error("Order not available"));
  }, [id, fetchOrderById]);

  if (!order) return null;

  const lineTotal = (price: number, quantity: number) => Number(price) * quantity;

  return (
    <div className="admin-fade-in">
      <PageHeader title={`Order ${order.id}`} description={`${order.fulfilment} · ${order.status}`} />
      <Link href="/admin/orders" className="mb-6 inline-block text-sm text-white/50">Back to orders</Link>
      <div className="mb-6 grid gap-2 text-sm text-white/80">
        <p>Customer {order.customer}</p>
        <p>{order.email} {order.phone}</p>
        <p>Branch {order.location}</p>
        <p className="capitalize">Payment {order.paymentMethod}</p>
        {order.address && <p>{order.address}</p>}
        {order.notes && <p>Notes {order.notes}</p>}
        <p>Placed {order.createdAt}</p>
      </div>
      <div className="mb-6 overflow-x-auto rounded-xl border border-white/10">
        <table className="w-full text-sm">
          <tbody>
            {order.items.map((item) => (
              <tr key={item.name} className="border-b border-white/5">
                <td className="px-4 py-3 text-white">{item.quantity} x {item.name}</td>
                <td className="px-4 py-3 text-right text-white/70">£{Number(item.price).toFixed(2)}</td>
                <td className="px-4 py-3 text-right text-white">£{lineTotal(item.price, item.quantity).toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="text-sm text-white/70">Subtotal £{Number(order.subtotal ?? order.total).toFixed(2)}</p>
      <p className="text-sm text-white/70">Delivery £{Number(order.deliveryFee ?? 0).toFixed(2)}</p>
      <p className="mb-6 text-lg text-white">Total £{Number(order.total).toFixed(2)}</p>
      <Dropdown
        options={[
          { value: order.status, label: labels[order.status] ?? order.status },
          ...order.allowedStatuses.filter((status) => status !== order.status).map((status) => ({ value: status, label: labels[status] ?? status })),
        ]}
        value={order.status}
        onChange={(value) => {
          if (value === order.status) return;
          updateOrderStatus(order.id, value as AdminOrder["status"])
            .then(() => fetchOrderById(order.id).then(setOrder))
            .catch(() => toast.error("That status change was rejected"));
        }}
        className="w-48"
      />
    </div>
  );
}
