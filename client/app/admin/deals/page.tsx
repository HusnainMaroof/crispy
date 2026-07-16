"use client";

import { useState } from "react";
import PageHeader from "@/components/admin/ui/page-header";
import Modal from "@/components/admin/ui/modal";
import { useDeals } from "@/lib/admin/use-deals";

export default function DealsPage() {
  const { deals, addDeal, updateDeal, deleteDeal, toggleDealActive } = useDeals();
  const [showForm, setShowForm] = useState(false);
  const [editingDeal, setEditingDeal] = useState<string | null>(null);

  const handleEdit = (id: string) => {
    setEditingDeal(id);
    setShowForm(true);
  };

  const handleDelete = (id: string) => {
    if (confirm("Are you sure you want to delete this deal?")) {
      deleteDeal(id);
    }
  };

  return (
    <div>
      <PageHeader
        title="Deals"
        description="Manage promotional deals and offers."
        action={
          <button
            onClick={() => {
              setEditingDeal(null);
              setShowForm(true);
            }}
            className="rounded-lg bg-brand-red px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-red-700"
          >
            Add Deal
          </button>
        }
      />

      {/* Deals Table */}
      <div className="overflow-x-auto rounded-xl border border-white/10 bg-white/5">
        <table className="w-full">
          <thead>
            <tr className="border-b border-white/10 text-left text-xs font-medium uppercase tracking-wider text-white/50">
              <th className="px-6 py-3">Deal</th>
              <th className="px-6 py-3">Price</th>
              <th className="px-6 py-3">Badge</th>
              <th className="px-6 py-3">Status</th>
              <th className="px-6 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {deals.map((deal) => (
              <tr key={deal.id} className="transition-colors hover:bg-white/5">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <img
                      src={deal.image}
                      alt={deal.name}
                      className="h-10 w-10 rounded-lg object-cover"
                    />
                    <div>
                      <p className="text-sm font-medium text-white">{deal.name}</p>
                      <p className="max-w-xs truncate text-xs text-white/50">
                        {deal.description}
                      </p>
                    </div>
                  </div>
                </td>
                <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-white">
                  {deal.price}
                </td>
                <td className="px-6 py-4">
                  {deal.badge && (
                    <span
                      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        deal.badgeVariant === "vegan"
                          ? "bg-green-500/20 text-green-400"
                          : "bg-brand-red/20 text-brand-red"
                      }`}
                    >
                      {deal.badge}
                    </span>
                  )}
                </td>
                <td className="px-6 py-4">
                  <button
                    onClick={() => toggleDealActive(deal.id)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      deal.active ? "bg-brand-red" : "bg-white/20"
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        deal.active ? "translate-x-6" : "translate-x-1"
                      }`}
                    />
                  </button>
                </td>
                <td className="px-6 py-4 text-right">
                  <button
                    onClick={() => handleEdit(deal.id)}
                    className="mr-3 text-white/50 hover:text-white"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(deal.id)}
                    className="text-white/50 hover:text-brand-red"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {deals.length === 0 && (
          <div className="py-12 text-center text-sm text-white/50">
            No deals yet. Add your first deal to get started.
          </div>
        )}
      </div>

      {/* Form Modal */}
      {showForm && (
        <DealForm
          dealId={editingDeal}
          deals={deals}
          onSave={(data) => {
            if (editingDeal) {
              updateDeal(editingDeal, data);
            } else {
              addDeal(data);
            }
            setShowForm(false);
            setEditingDeal(null);
          }}
          onClose={() => {
            setShowForm(false);
            setEditingDeal(null);
          }}
        />
      )}
    </div>
  );
}

function DealForm({
  dealId,
  deals,
  onSave,
  onClose,
}: {
  dealId: string | null;
  deals: { id: string; name: string; description: string; price: string; priceValue: number; image: string; badge?: string; badgeVariant?: "default" | "vegan"; active: boolean }[];
  onSave: (data: { name: string; description: string; price: string; priceValue: number; image: string; badge?: string; badgeVariant?: "default" | "vegan"; active: boolean }) => void;
  onClose: () => void;
}) {
  const existing = dealId ? deals.find((d) => d.id === dealId) : null;

  const [name, setName] = useState(existing?.name || "");
  const [description, setDescription] = useState(existing?.description || "");
  const [price, setPrice] = useState(existing?.priceValue?.toString() || "");
  const [image, setImage] = useState(existing?.image || "");
  const [badge, setBadge] = useState(existing?.badge || "");
  const [badgeVariant, setBadgeVariant] = useState<"default" | "vegan">(
    existing?.badgeVariant || "default"
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const priceValue = parseFloat(price) || 0;
    onSave({
      name,
      description,
      price: `£${priceValue.toFixed(2)}`,
      priceValue,
      image: image || "/placeholder.jpg",
      badge: badge || undefined,
      badgeVariant: badge ? badgeVariant : undefined,
      active: existing?.active ?? true,
    });
  };

  return (
    <Modal onClose={onClose} title={dealId ? "Edit Deal" : "Add Deal"}>
      <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm text-white/50">Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white outline-none focus:border-brand-red/50"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm text-white/50">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white outline-none focus:border-brand-red/50"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1 block text-sm text-white/50">Price (£)</label>
              <input
                type="number"
                step="0.01"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                required
                className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white outline-none focus:border-brand-red/50"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm text-white/50">Badge (optional)</label>
              <input
                type="text"
                value={badge}
                onChange={(e) => setBadge(e.target.value)}
                placeholder="e.g. Popular, New"
                className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white placeholder-white/30 outline-none focus:border-brand-red/50"
              />
            </div>
          </div>
          {badge && (
            <div>
              <label className="mb-1 block text-sm text-white/50">Badge Type</label>
              <select
                value={badgeVariant}
                onChange={(e) => setBadgeVariant(e.target.value as "default" | "vegan")}
                className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white outline-none focus:border-brand-red/50"
              >
                <option value="default">Default</option>
                <option value="vegan">Vegan</option>
              </select>
            </div>
          )}
          <div>
            <label className="mb-1 block text-sm text-white/50">Image URL</label>
            <input
              type="url"
              value={image}
              onChange={(e) => setImage(e.target.value)}
              placeholder="https://..."
              className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white placeholder-white/30 outline-none focus:border-brand-red/50"
            />
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-white/10 px-4 py-2.5 text-sm text-white/50 transition-colors hover:bg-white/5 hover:text-white"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="rounded-lg bg-brand-red px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-red-700"
            >
              {dealId ? "Save Changes" : "Add Deal"}
            </button>
          </div>
        </form>
    </Modal>
  );
}
