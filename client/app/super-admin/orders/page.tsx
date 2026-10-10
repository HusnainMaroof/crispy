"use client";
import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import toast from "react-hot-toast";
import { RefreshCw, Trash2 } from "lucide-react";
import OrderingHeader from "@/app/components/admin/ui/ordering-header";
import Dropdown from "@/app/components/admin/ui/dropdown";
import ConfirmModal from "@/app/components/admin/ui/confirm-modal";
import { ListToolbar, ListMessage, Pagination, secondaryButton } from "@/app/components/admin/ui/list-toolbar";
import { TableSkeleton } from "@/app/components/admin/ui/skeleton";
import { useOrders, type AdminOrder } from "@/lib/admin/use-orders";
import { usePanel } from "@/lib/admin/use-panel";
import { useLocations } from "@/lib/admin/use-locations";
import { useAdminSession } from "@/lib/admin/session";
import { api } from "@/lib/api";

type DashboardStats = {
  total_orders?: number;
  active_orders?: number;
  revenue?: number;
  today_revenue?: number;
  status_counts?: Record<string, number>;
};

const PAGE_SIZE = 20;

const statusLabels: Record<string, string> = { pending: "Pending", preparing: "Preparing", ready: "Ready", "out-for-delivery": "Out for delivery", delivered: "Delivered", cancelled: "Cancelled" };
export default function OrdersPage() {
  const panel = usePanel();
  const { orders, pagination, loading, fetchOrders, updateOrderStatus, deleteOrder } = useOrders();
  const { locations, fetchLocations } = useLocations();
  const { user } = useAdminSession();
  // Deleting an order erases it outright, so the API allows super admins only.
  // The button is hidden rather than shown-and-403 for the same reason.
  const canDeleteOrder = user?.role === "superadmin";
  const [deleting, setDeleting] = useState<AdminOrder | null>(null);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [status, setStatus] = useState("all"); const [branch, setBranch] = useState("all"); const [fulfilment, setFulfilment] = useState("all");
  const [page, setPage] = useState(1); const [error, setError] = useState(""); const [pending, setPending] = useState<string[]>([]);
  // Derive the search term from the URL rather than syncing it into state. The
  // old `[]`-dep effect read window.location.search once on mount, so pushing
  // the same pathname with a new ?q= (which does not remount) left the box
  // showing the first search forever.
  // Declared before reload() because reload lists query in its dependencies.
  const searchParams = useSearchParams();
  const urlQuery = searchParams.get("q") ?? "";
  const [typedQuery, setTypedQuery] = useState("");
  const query = typedQuery || urlQuery;
  const reload = useCallback(async () => {
    setError("");
    await fetchOrders({
      status: status === "all" ? undefined : status,
      location_id: branch === "all" ? undefined : branch,
      fulfilment: fulfilment === "all" ? undefined : fulfilment,
      q: query.trim() || undefined,
      page,
      limit: PAGE_SIZE,
    });
  }, [fetchOrders, status, branch, fulfilment, query, page]);
  useEffect(() => { queueMicrotask(() => { void reload(); }); }, [reload]);
  useEffect(() => { queueMicrotask(() => { void fetchLocations(); }); }, [fetchLocations]);
  // The tiles describe the whole collection, so they come from the aggregate
  // endpoint. Counting the loaded page in the browser would report the page
  // size instead of the real total.
  useEffect(() => {
    let cancelled = false;
    api.get<DashboardStats>("/admin/dashboard/stats").then((value) => { if (!cancelled) setStats(value); }).catch(() => {});
    return () => { cancelled = true; };
  }, []);
  // Branch options come from the branches endpoint. They used to be derived
  // from the orders already loaded, which only ever described the rows that
  // happened to be on screen, so the list shrank as you filtered.
  const branchOptions = useMemo(() => locations.map((location) => ({ value: location.id, label: location.name })), [locations]);
  async function changeStatus(order: AdminOrder, next: string) {
    if (pending.includes(order.id) || next === order.status) return;
    setPending((current) => [...current, order.id]);
    try { await updateOrderStatus(order.id, next as AdminOrder["status"]); toast.success(`Order ${order.id} updated`); }
    catch (err) { toast.error(err instanceof Error ? err.message : "Could not update the order."); }
    finally { setPending((current) => current.filter((id) => id !== order.id)); }
  }
  return <div><OrderingHeader active="orders" />
    <div className="mb-7 grid grid-cols-3 divide-x divide-white/10 border-y border-white/10 py-5">
      {[
        { label: "Pending", value: stats?.status_counts?.pending ?? 0 },
        { label: "In progress", value: (stats?.status_counts?.preparing ?? 0) + (stats?.status_counts?.ready ?? 0) + (stats?.status_counts?.["out-for-delivery"] ?? 0) },
        { label: "Total orders", value: stats?.total_orders ?? 0 },
      ].map((item) => <div key={item.label} className="px-4 first:pl-0"><p className="text-xs text-white/60">{item.label}</p><p className="mt-1 text-2xl font-medium tabular-nums text-white">{loading ? "—" : item.value}</p></div>)}
    </div>
    <ListToolbar query={query} onQueryChange={(value) => { setTypedQuery(value); setPage(1); }} placeholder="Search order number or customer">
      <Dropdown aria-label="Order status" value={status} onChange={(value) => { setStatus(value); setPage(1); }} className="w-full sm:w-44" options={[{ value: "all", label: "All statuses" }, ...Object.entries(statusLabels).map(([value, label]) => ({ value, label }))]} />
      <Dropdown aria-label="Branch" value={branch} onChange={(value) => { setBranch(value); setPage(1); }} className="w-full sm:w-44" options={[{ value: "all", label: "All branches" }, ...branchOptions]} />
      <Dropdown aria-label="Fulfilment" value={fulfilment} onChange={(value) => { setFulfilment(value); setPage(1); }} className="w-full sm:w-36" options={[{ value: "all", label: "All types" }, { value: "delivery", label: "Delivery" }, { value: "collection", label: "Collection" }]} />
      <button type="button" className={secondaryButton} disabled={loading} onClick={() => void reload()} aria-label="Refresh orders"><RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} /></button>
    </ListToolbar>
    {error && <p role="alert" className="mb-4 text-sm text-red-400">{error}</p>}
    {loading ? <TableSkeleton /> : orders.length === 0 ? <ListMessage title="No orders found" detail="New orders will appear here. Try clearing your filters to see all orders." action={<button className={secondaryButton} onClick={() => { setTypedQuery(""); setStatus("all"); setBranch("all"); setFulfilment("all"); setPage(1); }}
    >Clear filters</button>} /> : <>
      <div className="overflow-x-auto rounded-xl border border-white/10"><table className="w-full min-w-[780px] text-left text-sm"><thead className="border-b border-white/10 bg-white/[0.025] text-xs uppercase tracking-wider text-white/50"><tr>{["Order / placed", "Customer", "Branch", "Type", "Total", "Status"].map((label) => <th key={label} scope="col" className="px-5 py-4 font-medium">{label}</th>)}{canDeleteOrder && <th scope="col" className="px-5 py-4 text-end font-medium"><span className="sr-only">Actions</span></th>}</tr></thead>
        <tbody className="divide-y divide-white/10">{orders.map((order) => <tr key={order.id} className="transition-colors hover:bg-white/[0.03]">
          <td className="px-5 py-4"><Link href={panel.href(`orders/${order.id}`)} className="font-medium text-white hover:underline">#{order.id}</Link><p className="mt-1 whitespace-nowrap text-xs text-white/50">{new Date(order.createdAt).toLocaleString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}</p></td>
          <td className="px-5 py-4 text-white/80">{order.customer}</td><td className="px-5 py-4 text-white/60">{order.location}</td><td className="px-5 py-4 capitalize text-white/60">{order.fulfilment}</td><td className="px-5 py-4 font-medium tabular-nums text-white">£{Number(order.total).toFixed(2)}</td>
          <td className="w-52 px-5 py-4">{order.allowedStatuses.length ? <Dropdown aria-label={`Status for order ${order.id}`} disabled={pending.includes(order.id)} value={order.status} options={[{ value: order.status, label: pending.includes(order.id) ? "Updating…" : statusLabels[order.status] }, ...order.allowedStatuses.filter((value) => value !== order.status).map((value) => ({ value, label: statusLabels[value] ?? value }))]} onChange={(value) => void changeStatus(order, value)} /> : <span className="text-white/60">{statusLabels[order.status]}</span>}</td>
          {canDeleteOrder && <td className="px-5 py-4 text-end">
            <button
              type="button"
              onClick={() => setDeleting(order)}
              aria-label={`Delete order ${order.id}`}
              title="Delete order"
              className="inline-flex size-9 cursor-pointer items-center justify-center rounded-lg border border-white/10 text-white/50 transition-colors hover:border-brand-red/40 hover:bg-brand-red/10 hover:text-brand-red focus-visible:outline-2 focus-visible:outline-brand-red"
            >
              <Trash2 aria-hidden className="size-4" />
            </button>
          </td>}
        </tr>)}</tbody></table></div><Pagination page={pagination.page} total={pagination.total} size={pagination.limit} onChange={setPage} />
    </>}
    {deleting && <ConfirmModal
      title={`Delete order #${deleting.id}?`}
      message={`This permanently removes the ${deleting.customer} order for £${Number(deleting.total).toFixed(2)} and cannot be undone. If you only need to stop the order, cancel it instead.`}
      confirmLabel="Delete order"
      onClose={() => setDeleting(null)}
      onConfirm={async () => {
        await deleteOrder(deleting.id);
        toast.success(`Order #${deleting.id} deleted`);
        void reload();
      }}
    />}
  </div>;
}
