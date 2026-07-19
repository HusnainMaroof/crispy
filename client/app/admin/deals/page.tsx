"use client";

import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { api } from "@/lib/api";
import PageHeader from "@/components/admin/ui/page-header";
import Modal from "@/components/admin/ui/modal";
import { TableSkeleton } from "@/components/admin/ui/skeleton";
import { useDeals } from "@/lib/admin/use-deals";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function DealsPage() {
  const { deals, loading, fetchDeals, addDeal, updateDeal, deleteDeal, toggleDealActive } = useDeals();
  const [showForm, setShowForm] = useState(false);
  const [editingDeal, setEditingDeal] = useState<string | null>(null);
  const [deletingDeal, setDeletingDeal] = useState<string | null>(null);

  useEffect(() => {
    fetchDeals();
  }, [fetchDeals]);

  const handleEdit = (id: string) => {
    setEditingDeal(id);
    setShowForm(true);
  };

  const handleDeleteConfirm = async () => {
    if (!deletingDeal) return;
    try {
      await deleteDeal(deletingDeal);
      toast.success("Deal deleted");
    } catch {
      toast.error("Failed to delete deal");
    } finally {
      setDeletingDeal(null);
    }
  };

  const handleToggle = async (id: string) => {
    try {
      await toggleDealActive(id);
      toast.success("Deal status updated");
    } catch {
      toast.error("Failed to update deal status");
    }
  };

  const handleSave = async (data: Parameters<typeof addDeal>[0]) => {
    try {
      if (editingDeal) {
        await updateDeal(editingDeal, data);
        toast.success("Deal updated");
      } else {
        await addDeal(data);
        toast.success("Deal added");
      }
      setShowForm(false);
      setEditingDeal(null);
    } catch {
      toast.error(editingDeal ? "Failed to update deal" : "Failed to add deal");
    }
  };

  return (
    <div className="admin-fade-in">
      <PageHeader
        title="Deals"
        description="Manage promotional deals and offers."
        action={
          <button
            onClick={() => {
              setEditingDeal(null);
              setShowForm(true);
            }}
            className="cursor-pointer btn-press rounded-lg bg-brand-red px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-red-700"
          >
            Add Deal
          </button>
        }
      />

      {loading && <TableSkeleton />}

      {/* Deals Table */}
      {!loading && deals.length === 0 && (
        <div className="rounded-xl border border-white/10 bg-white/5 py-12 text-center">
          <svg className="mx-auto h-12 w-12 text-white/20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v13m0-13V6a4 4 0 00-8 0v7m8 0l-8 8m8-8l8 8m-8-8H4" />
          </svg>
          <h3 className="mt-4 text-sm font-medium text-white">No deals yet</h3>
          <p className="mt-1 text-sm text-white/50">Get started by adding your first deal.</p>
          <button
            onClick={() => { setEditingDeal(null); setShowForm(true); }}
            className="cursor-pointer btn-press mt-4 inline-flex items-center gap-2 rounded-lg bg-brand-red px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-red-700"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add Deal
          </button>
        </div>
      )}

      {!loading && deals.length > 0 && (
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
                    onClick={() => handleToggle(deal.id)}
                    className={`cursor-pointer relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
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
                    className="cursor-pointer mr-3 text-white/50 hover:text-white"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => setDeletingDeal(deal.id)}
                    className="cursor-pointer text-white/50 hover:text-brand-red"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      )}

      {/* Delete Confirmation Modal */}
      {deletingDeal && (
        <Modal
          onClose={() => setDeletingDeal(null)}
          title="Delete Deal"
        >
          <p className="mb-6 text-sm text-white/70">
            Are you sure you want to delete <span className="font-medium text-white">{deals.find((d) => d.id === deletingDeal)?.name}</span>? This action cannot be undone.
          </p>
          <div className="flex justify-end gap-3">
            <button
              onClick={() => setDeletingDeal(null)}
              className="cursor-pointer rounded-lg border border-white/10 px-4 py-2.5 text-sm text-white/50 transition-colors hover:bg-white/5 hover:text-white"
            >
              Cancel
            </button>
            <button
              onClick={handleDeleteConfirm}
              className="cursor-pointer rounded-lg bg-brand-red px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-red-700"
            >
              Delete
            </button>
          </div>
        </Modal>
      )}

      {/* Form Modal */}
      {showForm && (
        <DealForm
          dealId={editingDeal}
          deals={deals}
          onSave={handleSave}
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
              <Select
                value={badgeVariant}
                onValueChange={(value) => setBadgeVariant(value as "default" | "vegan")}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="default">Default</SelectItem>
                  <SelectItem value="vegan">Vegan</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
          <div>
            <label className="mb-1 block text-sm text-white/50">Image</label>
            <div className="flex gap-2">
              <input
                type="url"
                value={image}
                onChange={(e) => setImage(e.target.value)}
                placeholder="https://... or upload"
                className="flex-1 rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white placeholder-white/30 outline-none focus:border-brand-red/50"
              />
              <label className="cursor-pointer rounded-lg border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-white/70 transition-colors hover:bg-white/10 hover:text-white">
                Upload
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/avif"
                  className="hidden"
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    const formData = new FormData();
                    formData.append("image", file);
                    try {
                      const { url } = await api.upload<{ url: string }>("/admin/upload", formData);
                      setImage(url);
                    } catch {
                      toast.error("Upload failed");
                    }
                  }}
                />
              </label>
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="cursor-pointer rounded-lg border border-white/10 px-4 py-2.5 text-sm text-white/50 transition-colors hover:bg-white/5 hover:text-white"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="cursor-pointer rounded-lg bg-brand-red px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-red-700"
            >
              {dealId ? "Save Changes" : "Add Deal"}
            </button>
          </div>
        </form>
    </Modal>
  );
}
