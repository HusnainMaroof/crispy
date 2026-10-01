"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { api, type Pagination as PageMeta } from "@/lib/api";
import { formatCurrency } from "@/lib/i18n";
import { useLocale } from "@/lib/i18n/locale-context";
import { Pagination } from "@/app/components/admin/ui/list-toolbar";

type Profile = { name: string | null; email: string | null; phone: string | null };
type Mine = { id: number; status: string; fulfilment: string; total: number; created_at: string };
const PAGE_SIZE = 20;

export default function MyOrdersPage() {
  const [profile, setProfile] = useState<Profile>({ name: "", email: "", phone: "" });
  const [orders, setOrders] = useState<Mine[]>([]);
  const [pagination, setPagination] = useState<PageMeta>({ page: 1, limit: PAGE_SIZE, total: 0, totalPages: 0, hasNextPage: false, hasPreviousPage: false });
  const [page, setPage] = useState(1);
  const [message, setMessage] = useState("");
  const { locale, t } = useLocale();

  useEffect(() => {
    api.get<Profile>("/customers/me").then((row) => setProfile({
      name: row.name ?? "",
      email: row.email ?? "",
      phone: row.phone ?? "",
    })).catch((err: Error) => setMessage(err.message));
  }, []);

  // Order history grows without bound, so it is paged by the server rather
  // than loading every past order into the page.
  const loadOrders = useCallback(async () => {
    try {
      const { items, pagination: meta } = await api.getPage<Mine>(`/orders/mine?page=${page}&limit=${PAGE_SIZE}`);
      setOrders(items);
      setPagination(meta);
    } catch (err) {
      setMessage(err instanceof Error ? err.message : t("error.generic"));
    }
  }, [page, t]);

  // queueMicrotask, matching the admin pages: it keeps the fetch off the effect
  // body's synchronous path, which the react-hooks lint rule rejects when
  // setState is reachable directly from the effect.
  useEffect(() => {
    queueMicrotask(() => { void loadOrders(); });
  }, [loadOrders]);

  async function save(event: React.FormEvent) {
    event.preventDefault();
    setMessage("");
    try {
      const saved = await api.patch<Profile>("/customers/me", {
        name: profile.name,
        email: profile.email,
        phone: profile.phone,
      });
      setProfile({ name: saved.name ?? "", email: saved.email ?? "", phone: saved.phone ?? "" });
      setMessage(t("orders.saved"));
    } catch (err) {
      setMessage(err instanceof Error ? err.message : t("error.generic"));
    }
  }

  return (
    <main className="min-h-screen bg-black px-4 py-16 text-white">
      <div className="mx-auto max-w-lg">
        <h1 className="font-[family-name:var(--font-korolev),Korolev,sans-serif] text-5xl uppercase">{t("orders.title")}</h1>
        <form onSubmit={(event) => void save(event)} className="mt-8 grid gap-3">
          <input required value={profile.name ?? ""} onChange={(event) => setProfile({ ...profile, name: event.target.value })} placeholder={t("orders.name")} className="h-12 rounded-2xl border border-white/10 bg-white/5 px-4 text-sm" />
          <input required type="email" value={profile.email ?? ""} onChange={(event) => setProfile({ ...profile, email: event.target.value })} placeholder={t("orders.email")} className="h-12 rounded-2xl border border-white/10 bg-white/5 px-4 text-sm" />
          <input required value={profile.phone ?? ""} onChange={(event) => setProfile({ ...profile, phone: event.target.value })} placeholder={t("orders.phone")} className="h-12 rounded-2xl border border-white/10 bg-white/5 px-4 text-sm" />
          <button type="submit" className="h-12 rounded-full bg-[#FF0931] text-sm font-medium">{t("orders.save")}</button>
        </form>
        {message && <p className="mt-4 text-sm text-white/70">{message}</p>}
        <ul className="mt-10 space-y-3">
          {orders.map((order) => (
            <li key={order.id}>
              <Link href={`/orders/${order.id}`} className="flex justify-between rounded-2xl border border-white/10 px-4 py-3 text-sm">
                <span>#{order.id} · {t(`status.${order.status}`)}</span>
                <span>{formatCurrency(Number(order.total), locale)}</span>
              </Link>
            </li>
          ))}
        </ul>
        {pagination.total > 0 && (
          <Pagination page={pagination.page} total={pagination.total} size={pagination.limit} onChange={setPage} />
        )}
      </div>
    </main>
  );
}
