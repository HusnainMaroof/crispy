"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import toast from "react-hot-toast";
import PageHeader from "@/app/components/admin/ui/page-header";
import Dropdown from "@/app/components/admin/ui/dropdown";
import { PageSkeleton } from "@/app/components/admin/ui/skeleton";
import { secondaryButton } from "@/app/components/admin/ui/list-toolbar";
import { useOrders, type AdminOrder } from "@/lib/admin/use-orders";
import { usePanel } from "@/lib/admin/use-panel";

const labels: Record<string, string> = { pending: "Pending", preparing: "Preparing", ready: "Ready", "out-for-delivery": "Out for delivery", delivered: "Delivered", cancelled: "Cancelled" };
const money = (value: number) => new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP" }).format(Number(value));

export default function OrderDetailPage() {
  const panel = usePanel(); const params = useParams<{ id: string }>();
  const { fetchOrderById, updateOrderStatus } = useOrders();
  const [order, setOrder] = useState<AdminOrder | null>(null); const [error, setError] = useState(""); const [saving, setSaving] = useState(false);
  useEffect(() => {
    let cancelled = false;
    fetchOrderById(params.id).then((value) => { if (!cancelled) setOrder(value); }).catch((err: Error) => { if (!cancelled) setError(err.message); });
    return () => { cancelled = true; };
  }, [params.id, fetchOrderById]);
  async function changeStatus(next: string) {
    if (!order || next === order.status) return;
    setSaving(true);
    try { await updateOrderStatus(order.id, next as AdminOrder["status"]); setOrder(await fetchOrderById(order.id)); toast.success("Order status updated"); }
    catch (err) { toast.error(err instanceof Error ? err.message : "Could not update the order."); } finally { setSaving(false); }
  }
  return <div>
    <Link href={panel.href("orders")} className="mb-5 inline-flex min-h-11 items-center text-sm text-white/60 hover:text-white">← Back to orders</Link>
    <PageHeader title={`Order #${params.id}`} description={order ? `${order.location} · ${new Date(order.createdAt).toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short" })}` : "Order details"} />
    {error && <div role="alert" className="space-y-3"><p className="text-sm text-red-400">{error}</p><Link href={panel.href("orders")} className={secondaryButton}>Return to orders</Link></div>}
    {!order && !error && <PageSkeleton />}
    {order && <div className="grid gap-8 xl:grid-cols-[minmax(0,1fr)_300px]">
      <div className="space-y-8">
        <section><h2 className="mb-3 font-display text-xl text-white">Items</h2><div className="overflow-x-auto rounded-xl border border-white/10"><table className="w-full min-w-96 text-left text-sm"><thead className="border-b border-white/10 text-xs uppercase tracking-wider text-white/50"><tr><th className="px-5 py-3 font-medium">Item</th><th className="px-5 py-3 text-right font-medium">Unit</th><th className="px-5 py-3 text-right font-medium">Total</th></tr></thead><tbody className="divide-y divide-white/10">{order.items.map((item, index) => <tr key={`${item.name}-${index}`}><td className="px-5 py-4 text-white">{item.quantity} × {item.name}</td><td className="px-5 py-4 text-right text-white/60">{money(item.price)}</td><td className="px-5 py-4 text-right tabular-nums text-white">{money(Number(item.price) * item.quantity)}</td></tr>)}</tbody></table></div></section>
        <section><h2 className="mb-3 font-display text-xl text-white">Customer & fulfilment</h2><dl className="grid gap-x-6 gap-y-4 border-y border-white/10 py-5 text-sm sm:grid-cols-2">{[["Customer", order.customer], ["Phone", order.phone || "—"], ["Email", order.email || "—"], ["Type", order.fulfilment], ["Payment", order.paymentMethod || "—"], ["Address", order.address || "—"]].map(([key, value]) => <div key={key}><dt className="text-white/50">{key}</dt><dd className="mt-1 break-words text-white">{value}</dd></div>)}</dl>{order.notes && <p className="mt-4 border-l-2 border-brand-red pl-4 text-sm text-white/80"><span className="block text-xs text-white/50">Customer note</span>{order.notes}</p>}</section>
      </div>
      <aside className="self-start rounded-xl border border-white/10 p-5"><h2 className="font-display text-xl text-white">Order summary</h2><dl className="mt-5 space-y-3 text-sm"><div className="flex justify-between text-white/60"><dt>Subtotal</dt><dd>{money(order.subtotal ?? order.total)}</dd></div><div className="flex justify-between text-white/60"><dt>Delivery</dt><dd>{money(order.deliveryFee ?? 0)}</dd></div><div className="flex justify-between border-t border-white/10 pt-4 text-lg font-medium text-white"><dt>Total</dt><dd>{money(order.total)}</dd></div></dl><div className="mt-7 space-y-2 border-t border-white/10 pt-5"><label htmlFor="order-status" className="text-sm text-white/70">Status</label><Dropdown id="order-status" disabled={saving || order.allowedStatuses.length === 0} options={[{ value: order.status, label: labels[order.status] ?? order.status }, ...order.allowedStatuses.filter((value) => value !== order.status).map((value) => ({ value, label: labels[value] ?? value }))]} value={order.status} onChange={(value) => void changeStatus(value)} /><p className="text-xs leading-relaxed text-white/50">Only allowed next steps are shown.</p></div></aside>
    </div>}
  </div>;
}
