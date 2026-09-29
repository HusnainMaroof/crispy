"use client";
import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import toast from "react-hot-toast";
import { RefreshCw } from "lucide-react";
import OrderingHeader from "@/app/components/admin/ui/ordering-header";
import Dropdown from "@/app/components/admin/ui/dropdown";
import { ListToolbar, ListMessage, Pagination, secondaryButton } from "@/app/components/admin/ui/list-toolbar";
import { TableSkeleton } from "@/app/components/admin/ui/skeleton";
import { useOrders, type AdminOrder } from "@/lib/admin/use-orders";
import { usePanel } from "@/lib/admin/use-panel";

const statusLabels: Record<string, string> = { pending: "Pending", preparing: "Preparing", ready: "Ready", "out-for-delivery": "Out for delivery", delivered: "Delivered", cancelled: "Cancelled" };
export default function OrdersPage() {
  const panel = usePanel();
  const { orders, loading, fetchOrders, updateOrderStatus } = useOrders();
  const [query, setQuery] = useState(""); const [status, setStatus] = useState("all"); const [branch, setBranch] = useState("all"); const [fulfilment, setFulfilment] = useState("all");
  const [page, setPage] = useState(1); const [error, setError] = useState(""); const [pending, setPending] = useState<string[]>([]);
  const reload = useCallback(async () => { setError(""); try { await fetchOrders(); } catch (err) { setError(err instanceof Error ? err.message : "Could not load orders."); } }, [fetchOrders]);
  useEffect(() => { queueMicrotask(() => { void reload(); }); }, [reload]);
  useEffect(() => { queueMicrotask(() => { const requested = new URLSearchParams(window.location.search).get("q"); if (requested) setQuery(requested); }); }, []);
  const filtered = orders.filter((order) => `${order.id} ${order.customer} ${order.email ?? ""}`.toLowerCase().includes(query.toLowerCase()) && (status === "all" || order.status === status) && (branch === "all" || order.location === branch) && (fulfilment === "all" || order.fulfilment === fulfilment)).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  const currentPage = Math.min(page, Math.max(1, Math.ceil(filtered.length / 20)));
  async function changeStatus(order: AdminOrder, next: string) {
    if (pending.includes(order.id) || next === order.status) return;
    setPending((current) => [...current, order.id]);
    try { await updateOrderStatus(order.id, next as AdminOrder["status"]); toast.success(`Order ${order.id} updated`); }
    catch (err) { toast.error(err instanceof Error ? err.message : "Could not update the order."); }
    finally { setPending((current) => current.filter((id) => id !== order.id)); }
  }
  return <div><OrderingHeader active="orders" />
    <div className="mb-7 grid grid-cols-3 divide-x divide-white/10 border-y border-white/10 py-5">
      {[{ label: "Pending", value: orders.filter((order) => order.status === "pending").length }, { label: "In progress", value: orders.filter((order) => ["preparing", "ready", "out-for-delivery"].includes(order.status)).length }, { label: "Total orders", value: orders.length }].map((item) => <div key={item.label} className="px-4 first:pl-0"><p className="text-xs text-white/60">{item.label}</p><p className="mt-1 text-2xl font-medium tabular-nums text-white">{loading ? "—" : item.value}</p></div>)}
    </div>
    <ListToolbar query={query} onQueryChange={(value) => { setQuery(value); setPage(1); }} placeholder="Search order number or customer">
      <Dropdown aria-label="Order status" value={status} onChange={(value) => { setStatus(value); setPage(1); }} className="w-full sm:w-44" options={[{ value: "all", label: "All statuses" }, ...Object.entries(statusLabels).map(([value, label]) => ({ value, label }))]} />
      <Dropdown aria-label="Branch" value={branch} onChange={(value) => { setBranch(value); setPage(1); }} className="w-full sm:w-44" options={[{ value: "all", label: "All branches" }, ...Array.from(new Set(orders.map((order) => order.location).filter(Boolean))).map((value) => ({ value, label: value }))]} />
      <Dropdown aria-label="Fulfilment" value={fulfilment} onChange={(value) => { setFulfilment(value); setPage(1); }} className="w-full sm:w-36" options={[{ value: "all", label: "All types" }, { value: "delivery", label: "Delivery" }, { value: "collection", label: "Collection" }]} />
      <button type="button" className={secondaryButton} disabled={loading} onClick={() => void reload()} aria-label="Refresh orders"><RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} /></button>
    </ListToolbar>
    {error && <p role="alert" className="mb-4 text-sm text-red-400">{error}</p>}
    {loading ? <TableSkeleton /> : filtered.length === 0 ? <ListMessage title="No orders found" detail="New orders will appear here. Try clearing your filters to see all orders." action={<button className={secondaryButton} onClick={() => { setQuery(""); setStatus("all"); setBranch("all"); setFulfilment("all"); }}>Clear filters</button>} /> : <>
      <div className="overflow-x-auto rounded-xl border border-white/10"><table className="w-full min-w-[780px] text-left text-sm"><thead className="border-b border-white/10 bg-white/[0.025] text-xs uppercase tracking-wider text-white/50"><tr>{["Order / placed", "Customer", "Branch", "Type", "Total", "Status"].map((label) => <th key={label} scope="col" className="px-5 py-4 font-medium">{label}</th>)}</tr></thead>
        <tbody className="divide-y divide-white/10">{filtered.slice((currentPage - 1) * 20, currentPage * 20).map((order) => <tr key={order.id} className="transition-colors hover:bg-white/[0.03]">
          <td className="px-5 py-4"><Link href={panel.href(`orders/${order.id}`)} className="font-medium text-white hover:underline">#{order.id}</Link><p className="mt-1 whitespace-nowrap text-xs text-white/50">{new Date(order.createdAt).toLocaleString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}</p></td>
          <td className="px-5 py-4 text-white/80">{order.customer}</td><td className="px-5 py-4 text-white/60">{order.location}</td><td className="px-5 py-4 capitalize text-white/60">{order.fulfilment}</td><td className="px-5 py-4 font-medium tabular-nums text-white">£{Number(order.total).toFixed(2)}</td>
          <td className="w-52 px-5 py-4">{order.allowedStatuses.length ? <Dropdown aria-label={`Status for order ${order.id}`} disabled={pending.includes(order.id)} value={order.status} options={[{ value: order.status, label: pending.includes(order.id) ? "Updating…" : statusLabels[order.status] }, ...order.allowedStatuses.filter((value) => value !== order.status).map((value) => ({ value, label: statusLabels[value] ?? value }))]} onChange={(value) => void changeStatus(order, value)} /> : <span className="text-white/60">{statusLabels[order.status]}</span>}</td>
        </tr>)}</tbody></table></div><Pagination page={currentPage} total={filtered.length} onChange={setPage} />
    </>}
  </div>;
}
