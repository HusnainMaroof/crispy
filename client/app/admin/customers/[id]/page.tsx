"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import PageHeader from "@/app/components/admin/ui/page-header";
import { api } from "@/lib/api";

type CustomerDetail = {
  id: string;
  name: string | null;
  email: string | null;
  phone: string | null;
  created_at: string;
  order_count: number;
  orders: {
    id: number;
    created_at: string;
    status: string;
    total: number;
    fulfilment: string;
    location_name: string | null;
    address: string | null;
  }[];
};

export default function CustomerDetailPage() {
  const params = useParams<{ id: string }>();
  const [customer, setCustomer] = useState<CustomerDetail | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!params.id) return;
    api.get<CustomerDetail>(`/admin/customers/${params.id}`)
      .then(setCustomer)
      .catch((err: Error) => setError(err.message));
  }, [params.id]);

  return (
    <div className="admin-fade-in">
      <PageHeader title={customer?.name || "Customer"} description={customer?.email || ""} />
      <Link href="/admin/customers" className="mb-6 inline-block text-sm text-white/50">Back to customers</Link>
      {error && <p className="text-sm text-red-400">{error}</p>}
      {customer && (
        <>
          <div className="mb-6 grid gap-2 text-sm text-white/80">
            <p>{customer.phone || "No phone"}</p>
            <p>{customer.order_count} orders you can see</p>
            <p>Since {new Date(customer.created_at).toLocaleString()}</p>
          </div>
          <div className="overflow-x-auto rounded-xl border border-white/10">
            <table className="w-full text-sm">
              <tbody>
                {customer.orders.map((order) => (
                  <tr key={order.id} className="border-b border-white/5">
                    <td className="px-4 py-3 text-white">
                      <Link href={`/admin/orders/${order.id}`} className="underline">#{order.id}</Link>
                    </td>
                    <td className="px-4 py-3 text-white/70">{order.location_name}</td>
                    <td className="px-4 py-3 capitalize text-white/70">{order.fulfilment}</td>
                    <td className="px-4 py-3 text-white/70">{order.status}</td>
                    <td className="px-4 py-3 text-right text-white">£{Number(order.total).toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
