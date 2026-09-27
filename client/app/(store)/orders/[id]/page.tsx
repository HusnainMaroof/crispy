"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { api } from "@/lib/api";
import { formatCurrency } from "@/lib/i18n";
import { useLocale } from "@/lib/i18n/locale-context";

type OrderView = {
  order: {
    id: number;
    status: string;
    fulfilment: string;
    total: number;
    customer_name: string;
  };
  items: { name: string; quantity: number; price: number }[];
};

export default function CustomerOrderPage() {
  const params = useParams<{ id: string }>();
  const [view, setView] = useState<OrderView | null>(null);
  const [error, setError] = useState("");
  const { locale, t } = useLocale();

  useEffect(() => {
    if (!params.id) return;
    api.get<OrderView>(`/orders/${params.id}`)
      .then(setView)
      .catch((err: Error) => setError(err.message));
  }, [params.id]);

  return (
    <main className="min-h-screen bg-black px-4 py-16 text-white">
      <div className="mx-auto max-w-lg">
        <h1 className="font-[family-name:var(--font-korolev),Korolev,sans-serif] text-5xl uppercase">{t("orders.one")}</h1>
        <a href="/orders" className="mt-4 inline-block text-sm text-white/50">{t("orders.all")}</a>
        {error && <p className="mt-6 text-sm text-[#FF0931]">{error}</p>}
        {view && (
          <>
            <p className="mt-4 text-sm text-white/60">Order #{view.order.id} is {t(`status.${view.order.status}`)}.</p>
            <p className="mt-2 text-sm capitalize">{view.order.fulfilment}</p>
            <ul className="mt-6 space-y-2 text-sm">
              {view.items.map((item) => (
                <li key={item.name} className="flex justify-between">
                  <span>{item.quantity} x {item.name}</span>
                  <span>{formatCurrency(Number(item.price), locale)}</span>
                </li>
              ))}
            </ul>
            <p className="mt-6 text-lg">{t("checkout.total")} {formatCurrency(Number(view.order.total), locale)}</p>
          </>
        )}
      </div>
    </main>
  );
}
