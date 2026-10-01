"use client";
import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import OrderingHeader from "@/app/components/admin/ui/ordering-header";
import { ListToolbar, ListMessage, Pagination, secondaryButton } from "@/app/components/admin/ui/list-toolbar";
import { TableSkeleton } from "@/app/components/admin/ui/skeleton";
import { usePanel } from "@/lib/admin/use-panel";
import { api, type Pagination as PageMeta } from "@/lib/api";
type CustomerRow = { id: string; name: string | null; email: string | null; phone: string | null; created_at: string; order_count: number; latest_order: { id: number; created_at: string; status: string; location_name: string | null } | null };
const PAGE_SIZE = 20;
export default function CustomersPage() {
  const panel = usePanel();
  const [customers, setCustomers] = useState<CustomerRow[]>([]);
  const [pagination, setPagination] = useState<PageMeta>({ page: 1, limit: PAGE_SIZE, total: 0, totalPages: 0, hasNextPage: false, hasPreviousPage: false });
  const [query, setQuery] = useState(""); const [loading, setLoading] = useState(true); const [error, setError] = useState(""); const [page, setPage] = useState(1); const [retry, setRetry] = useState(0);
  // Search and paging are both handled by the server now, so the result set is
  // exactly the rows shown and `total` describes every match rather than the
  // length of what happened to be downloaded.
  const load = useCallback(async (signal: { cancelled: boolean }) => {
    setLoading(true); setError("");
    const params = new URLSearchParams();
    if (query.trim()) params.set("q", query.trim());
    params.set("page", String(page));
    params.set("limit", String(PAGE_SIZE));
    try { const { items, pagination: meta } = await api.getPage<CustomerRow>(`/admin/customers?${params.toString()}`); if (!signal.cancelled) { setCustomers(items); setPagination(meta); } }
    catch (err) { if (!signal.cancelled) { setError(err instanceof Error ? err.message : "Could not load customers."); setCustomers([]); } }
    finally { if (!signal.cancelled) setLoading(false); }
  }, [query, page]);
  useEffect(() => {
    const signal = { cancelled: false };
    const timer = setTimeout(() => { void load(signal); }, 200);
    return () => { signal.cancelled = true; clearTimeout(timer); };
  }, [load, retry]);
  return <div><OrderingHeader active="customers" /><ListToolbar query={query} onQueryChange={(value) => { setQuery(value); setPage(1); }} placeholder="Search name, email, or phone" />
    {error && <div role="alert" className="mb-5 flex items-center gap-3 text-sm text-red-400">{error}<button className={secondaryButton} onClick={() => setRetry((value) => value + 1)}>Retry</button></div>}
    {loading ? <TableSkeleton /> : customers.length === 0 ? <ListMessage title="No customers found" detail="Customers appear after placing an order. Try another name, email address, or phone number." /> : <>
      <div className="overflow-x-auto rounded-xl border border-white/10"><table className="w-full min-w-[680px] text-left text-sm"><thead className="border-b border-white/10 bg-white/[0.025] text-xs uppercase tracking-wider text-white/50"><tr>{["Customer", "Contact", "Orders", "Latest branch", "Customer since"].map((label) => <th key={label} scope="col" className="px-5 py-4 font-medium">{label}</th>)}</tr></thead>
        <tbody className="divide-y divide-white/10">{customers.map((customer) => <tr key={customer.id} className="transition-colors hover:bg-white/[0.03]"><td className="px-5 py-4"><Link href={panel.href(`customers/${customer.id}`)} className="font-medium text-white hover:underline">{customer.name || "Guest"}</Link></td><td className="px-5 py-4 text-white/70">{customer.email || "No email"}<p className="mt-1 text-xs text-white/50">{customer.phone || "No phone"}</p></td><td className="px-5 py-4 tabular-nums text-white">{customer.order_count}</td><td className="px-5 py-4 text-white/60">{customer.latest_order?.location_name ?? "—"}</td><td className="px-5 py-4 text-white/60">{new Date(customer.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}</td></tr>)}</tbody>
      </table></div><Pagination page={pagination.page} total={pagination.total} size={pagination.limit} onChange={setPage} />
    </>}
  </div>;
}
