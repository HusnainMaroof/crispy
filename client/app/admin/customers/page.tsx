"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import PageHeader from "@/app/components/admin/ui/page-header";
import { TableSkeleton } from "@/app/components/admin/ui/skeleton";
import { api } from "@/lib/api";

type CustomerRow = {
  id: string;
  name: string | null;
  email: string | null;
  phone: string | null;
  created_at: string;
  order_count: number;
  latest_order: { id: number; created_at: string; status: string; location_name: string | null } | null;
};

export default function CustomersPage() {
  const [customers, setCustomers] = useState<CustomerRow[]>([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const handle = setTimeout(() => {
      setLoading(true);
      const path = query.trim() ? `/admin/customers?q=${encodeURIComponent(query.trim())}` : "/admin/customers";
      api.get<CustomerRow[]>(path)
        .then(setCustomers)
        .catch(() => setCustomers([]))
        .finally(() => setLoading(false));
    }, 200);
    return () => clearTimeout(handle);
  }, [query]);

  return (
    <div className="admin-fade-in">
      <PageHeader title="Customers" description="People who have ordered, limited to your branches." />
      <input
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder="Search name, email, or phone"
        className="mb-6 h-11 w-full max-w-md rounded-xl border border-white/10 bg-white/5 px-4 text-sm text-white"
      />
      {loading ? <TableSkeleton /> : <div className="overflow-x-auto rounded-xl border border-white/10 bg-white/5">
        <table className="w-full">
          <thead>
            <tr className="border-b border-white/10 text-left text-xs font-medium uppercase tracking-wider text-white/50">
              <th className="px-6 py-3">Name</th>
              <th className="px-6 py-3">Email</th>
              <th className="px-6 py-3">Phone</th>
              <th className="px-6 py-3">Orders</th>
              <th className="px-6 py-3">Latest</th>
              <th className="px-6 py-3">Since</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {customers.map((customer) => (
              <tr key={customer.id} className="hover:bg-white/5">
                <td className="px-6 py-4 text-sm text-white">
                  <Link href={`/admin/customers/${customer.id}`} className="underline">{customer.name || "Guest"}</Link>
                </td>
                <td className="px-6 py-4 text-sm text-white/70">{customer.email || "—"}</td>
                <td className="px-6 py-4 text-sm text-white/70">{customer.phone || "—"}</td>
                <td className="px-6 py-4 text-sm text-white">{customer.order_count}</td>
                <td className="px-6 py-4 text-sm text-white/70">
                  {customer.latest_order ? `${customer.latest_order.location_name ?? "Branch"} · ${customer.latest_order.status}` : "—"}
                </td>
                <td className="px-6 py-4 text-sm text-white/70">{new Date(customer.created_at).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {customers.length === 0 && <div className="py-12 text-center text-sm text-white/50">No customers found.</div>}
      </div>}
    </div>
  );
}
