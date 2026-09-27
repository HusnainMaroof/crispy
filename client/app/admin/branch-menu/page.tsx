"use client";

import { useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";
import { api } from "@/lib/api";
import PageHeader from "@/app/components/admin/ui/page-header";
import Dropdown from "@/app/components/admin/ui/dropdown";
import { TableSkeleton } from "@/app/components/admin/ui/skeleton";
import { useLocations } from "@/lib/admin/use-locations";

type MenuRow = {
  menu_item_id: string;
  name: string;
  inherited_price: number;
  price: number | null;
  available: boolean;
};

type DealRow = {
  deal_id: string;
  name: string;
  inherited_price: number;
  price: number | null;
  available: boolean;
};

function money(value: number) {
  return `£${Number(value).toFixed(2)}`;
}

export default function BranchMenuPage() {
  const { locations, loading: locationsLoading, fetchLocations } = useLocations();
  const [branchId, setBranchId] = useState("");
  const [items, setItems] = useState<MenuRow[]>([]);
  const [deals, setDeals] = useState<DealRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchLocations();
  }, [fetchLocations]);

  useEffect(() => {
    if (!branchId && locations[0]) setBranchId(locations[0].id);
  }, [branchId, locations]);

  const load = useCallback(async (id: string) => {
    setLoading(true);
    try {
      const [menu, branchDeals] = await Promise.all([
        api.get<Record<string, unknown>[]>(`/admin/locations/${id}/menu`),
        api.get<Record<string, unknown>[]>(`/admin/locations/${id}/deals`),
      ]);
      setItems(menu.map((row) => ({
        menu_item_id: String(row.menu_item_id),
        name: String(row.name),
        inherited_price: Number(row.inherited_price),
        price: row.price == null ? null : Number(row.price),
        available: Boolean(row.available),
      })));
      setDeals(branchDeals.map((row) => ({
        deal_id: String(row.deal_id),
        name: String(row.name),
        inherited_price: Number(row.inherited_price),
        price: row.price == null ? null : Number(row.price),
        available: Boolean(row.available),
      })));
    } catch {
      toast.error("Could not load this branch catalogue");
      setItems([]);
      setDeals([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (branchId) void load(branchId);
  }, [branchId, load]);

  const save = async () => {
    if (!branchId) return;
    setSaving(true);
    try {
      if (items.length > 0) {
        await api.put(`/admin/locations/${branchId}/menu`, {
          items: items.map((item) => ({
            menu_item_id: item.menu_item_id,
            price: item.price,
            available: item.available,
          })),
        });
      }
      if (deals.length > 0) {
        await api.put(`/admin/locations/${branchId}/deals`, {
          deals: deals.map((deal) => ({
            deal_id: deal.deal_id,
            price: deal.price,
            available: deal.available,
          })),
        });
      }
      toast.success("Branch catalogue saved");
      await load(branchId);
    } catch {
      toast.error("Could not save this branch catalogue");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="admin-fade-in">
      <PageHeader
        title="Branch catalogue"
        description="Development mock catalogue. This is not the real Crispies menu. Availability and price overrides apply only to the selected branch."
        action={
          <button
            type="button"
            onClick={() => void save()}
            disabled={!branchId || saving}
            className="cursor-pointer rounded-full bg-brand-red px-5 py-3 text-xs font-bold uppercase tracking-widest text-white disabled:opacity-60"
          >
            {saving ? "Saving..." : "Save"}
          </button>
        }
      />

      <div className="mb-6 max-w-xs">
        <Dropdown
          options={locations.map((location) => ({ value: location.id, label: location.name }))}
          value={branchId}
          onChange={setBranchId}
          placeholder="Select a branch"
        />
      </div>

      {(locationsLoading || loading) && <TableSkeleton />}

      {!loading && items.length > 0 && (
        <div className="mb-8 overflow-x-auto rounded-xl border border-white/10 bg-white/5">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/10 text-left text-xs font-medium uppercase tracking-wider text-white/50">
                <th className="px-6 py-3">Product</th>
                <th className="px-6 py-3">Global</th>
                <th className="px-6 py-3">Available</th>
                <th className="px-6 py-3">Branch price</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {items.map((item) => (
                <tr key={item.menu_item_id}>
                  <td className="px-6 py-4 text-sm text-white">{item.name}</td>
                  <td className="px-6 py-4 text-sm text-white/70">{money(item.inherited_price)}</td>
                  <td className="px-6 py-4">
                    <button
                      type="button"
                      onClick={() => setItems((rows) => rows.map((row) => row.menu_item_id === item.menu_item_id ? { ...row, available: !row.available } : row))}
                      className={`cursor-pointer rounded-full px-3 py-1 text-xs font-bold uppercase tracking-widest ${item.available ? "bg-green-500/20 text-green-400" : "bg-white/10 text-white/50"}`}
                    >
                      {item.available ? "On" : "Off"}
                    </button>
                  </td>
                  <td className="px-6 py-4">
                    <input
                      value={item.price ?? ""}
                      placeholder="Global"
                      onChange={(event) => {
                        const next = event.target.value.trim();
                        setItems((rows) => rows.map((row) => row.menu_item_id === item.menu_item_id
                          ? { ...row, price: next === "" ? null : Number(next) }
                          : row));
                      }}
                      className="h-10 w-28 rounded-xl border border-white/10 bg-black px-3 text-sm text-white outline-none focus:border-brand-red/60"
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {!loading && deals.length > 0 && (
        <div className="overflow-x-auto rounded-xl border border-white/10 bg-white/5">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/10 text-left text-xs font-medium uppercase tracking-wider text-white/50">
                <th className="px-6 py-3">Deal</th>
                <th className="px-6 py-3">Global</th>
                <th className="px-6 py-3">Available</th>
                <th className="px-6 py-3">Branch price</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {deals.map((deal) => (
                <tr key={deal.deal_id}>
                  <td className="px-6 py-4 text-sm text-white">{deal.name}</td>
                  <td className="px-6 py-4 text-sm text-white/70">{money(deal.inherited_price)}</td>
                  <td className="px-6 py-4">
                    <button
                      type="button"
                      onClick={() => setDeals((rows) => rows.map((row) => row.deal_id === deal.deal_id ? { ...row, available: !row.available } : row))}
                      className={`cursor-pointer rounded-full px-3 py-1 text-xs font-bold uppercase tracking-widest ${deal.available ? "bg-green-500/20 text-green-400" : "bg-white/10 text-white/50"}`}
                    >
                      {deal.available ? "On" : "Off"}
                    </button>
                  </td>
                  <td className="px-6 py-4">
                    <input
                      value={deal.price ?? ""}
                      placeholder="Global"
                      onChange={(event) => {
                        const next = event.target.value.trim();
                        setDeals((rows) => rows.map((row) => row.deal_id === deal.deal_id
                          ? { ...row, price: next === "" ? null : Number(next) }
                          : row));
                      }}
                      className="h-10 w-28 rounded-xl border border-white/10 bg-black px-3 text-sm text-white outline-none focus:border-brand-red/60"
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
