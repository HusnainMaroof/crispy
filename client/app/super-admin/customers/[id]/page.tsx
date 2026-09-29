"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import PageHeader from "@/app/components/admin/ui/page-header";
import { PageSkeleton } from "@/app/components/admin/ui/skeleton";
import { ListMessage } from "@/app/components/admin/ui/list-toolbar";
import { api } from "@/lib/api";
import { usePanel } from "@/lib/admin/use-panel";

type CustomerDetail = { id: string; name: string | null; email: string | null; phone: string | null; created_at: string; order_count: number; orders: { id: number; created_at: string; status: string; total: number; fulfilment: string; location_name: string | null }[] };
const money = (value: number) => new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP" }).format(Number(value));
export default function CustomerDetailPage() {
  const panel = usePanel(); const params = useParams<{ id: string }>();
  const [customer, setCustomer] = useState<CustomerDetail | null>(null); const [error, setError] = useState("");
  useEffect(() => {
    let cancelled = false;
    api.get<CustomerDetail>(`/admin/customers/${params.id}`).then((value) => { if (!cancelled) setCustomer(value); }).catch((err: Error) => { if (!cancelled) setError(err.message); });
    return () => { cancelled = true; };
  }, [params.id]);
  return <div>
    <Link href={panel.href("customers")} className="mb-5 inline-flex min-h-11 items-center text-sm text-white/60 hover:text-white">← Back to customers</Link>
    <PageHeader title={customer?.name || "Customer"} description={customer ? `Customer since ${new Date(customer.created_at).toLocaleDateString("en-GB", { month: "long", year: "numeric" })}` : "Customer details"} />
    {error && <p role="alert" className="text-sm text-red-400">{error}</p>}
    {!customer && !error && <PageSkeleton />}
    {customer && <div className="space-y-9"><dl className="grid gap-5 border-y border-white/10 py-6 sm:grid-cols-3">
      <div><dt className="text-xs uppercase tracking-wider text-white/50">Email</dt><dd className="mt-2 break-all text-sm text-white">{customer.email || "Not provided"}</dd></div>
      <div><dt className="text-xs uppercase tracking-wider text-white/50">Phone</dt><dd className="mt-2 text-sm text-white">{customer.phone || "Not provided"}</dd></div>
      <div><dt className="text-xs uppercase tracking-wider text-white/50">Orders you can access</dt><dd className="mt-2 text-xl font-medium tabular-nums text-white">{customer.order_count}</dd></div>
    </dl><section><h2 className="mb-4 font-display text-xl text-white">Order history</h2>{customer.orders.length === 0 ? <ListMessage title="No visible orders" detail="Orders at your assigned branches will appear here." /> : <div className="overflow-x-auto rounded-xl border border-white/10"><table className="w-full min-w-[640px] text-left text-sm"><thead className="border-b border-white/10 bg-white/[0.025] text-xs uppercase tracking-wider text-white/50"><tr>{["Order / placed", "Branch", "Type", "Status", "Total"].map((label) => <th key={label} scope="col" className="px-5 py-4 font-medium">{label}</th>)}</tr></thead><tbody className="divide-y divide-white/10">{customer.orders.map((order) => <tr key={order.id} className="hover:bg-white/[0.03]"><td className="px-5 py-4"><Link href={panel.href(`orders/${order.id}`)} className="font-medium text-white hover:underline">#{order.id}</Link><p className="mt-1 text-xs text-white/50">{new Date(order.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}</p></td><td className="px-5 py-4 text-white/60">{order.location_name || "—"}</td><td className="px-5 py-4 capitalize text-white/60">{order.fulfilment}</td><td className="px-5 py-4 capitalize text-white/70">{order.status.replaceAll("-", " ")}</td><td className="px-5 py-4 font-medium tabular-nums text-white">{money(order.total)}</td></tr>)}</tbody></table></div>}</section></div>}
  </div>;
}
