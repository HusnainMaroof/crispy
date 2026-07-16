"use client";

import { useState } from "react";
import PageHeader from "@/components/admin/ui/page-header";
import Modal from "@/components/admin/ui/modal";
import Dropdown from "@/components/admin/ui/dropdown";
import { useMenu } from "@/lib/admin/use-menu";
import { useCategories } from "@/lib/admin/use-categories";

export default function MenuPage() {
  const { items, addItem, updateItem, deleteItem } = useMenu();
  const { categories } = useCategories();
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState<string | null>(null);

  const categoryOptions = [
    { value: "all", label: "All Categories" },
    ...categories.map((cat) => ({ value: cat.id, label: cat.title })),
  ];

  const filtered = items.filter((item) => {
    const matchesSearch = item.name.toLowerCase().includes(search.toLowerCase());
    const matchesCategory =
      selectedCategory === "all" || item.categoryId === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const getCategoryName = (categoryId: string) =>
    categories.find((c) => c.id === categoryId)?.title || "Unknown";

  const handleEdit = (id: string) => {
    setEditingItem(id);
    setShowForm(true);
  };

  const handleDelete = (id: string) => {
    if (confirm("Are you sure you want to delete this item?")) {
      deleteItem(id);
    }
  };

  return (
    <div className="admin-fade-in">
      <PageHeader
        title="Menu Items"
        description="Manage your menu items across all categories."
        action={
          <button
            onClick={() => {
              setEditingItem(null);
              setShowForm(true);
            }}
            className="btn-press rounded-lg bg-brand-red px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-red-700"
          >
            Add Item
          </button>
        }
      />

      {/* Filters */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row">
        <div className="flex-1">
          <input
            type="text"
            placeholder="Search items..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white placeholder-white/30 outline-none transition-colors focus:border-brand-red/50"
          />
        </div>
        <Dropdown
          options={categoryOptions}
          value={selectedCategory}
          onChange={setSelectedCategory}
          placeholder="Filter by category"
          className="w-48"
        />
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-xl border border-white/10 bg-white/5">
        <table className="w-full">
          <thead>
            <tr className="border-b border-white/10 text-left text-xs font-medium uppercase tracking-wider text-white/50">
              <th className="px-6 py-3">Item</th>
              <th className="px-6 py-3">Category</th>
              <th className="px-6 py-3">Price</th>
              <th className="px-6 py-3">Badge</th>
              <th className="px-6 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {filtered.map((item, index) => (
              <tr
                key={item.id}
                className="transition-colors hover:bg-white/5 admin-slide-up"
                style={{ animationDelay: `${index * 30}ms` }}
              >
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <img
                      src={item.image}
                      alt={item.name}
                      className="h-10 w-10 rounded-lg object-cover"
                    />
                    <div>
                      <p className="text-sm font-medium text-white">{item.name}</p>
                      <p className="max-w-xs truncate text-xs text-white/50">
                        {item.description}
                      </p>
                    </div>
                  </div>
                </td>
                <td className="whitespace-nowrap px-6 py-4 text-sm text-white/70">
                  {getCategoryName(item.categoryId)}
                </td>
                <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-white">
                  {item.price}
                </td>
                <td className="px-6 py-4">
                  {item.badge && (
                    <span
                      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        item.badgeVariant === "vegan"
                          ? "bg-green-500/20 text-green-400"
                          : "bg-brand-red/20 text-brand-red"
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </td>
                <td className="px-6 py-4 text-right">
                  <button
                    onClick={() => handleEdit(item.id)}
                    className="btn-press mr-3 text-white/50 hover:text-white"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(item.id)}
                    className="btn-press text-white/50 hover:text-brand-red"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <div className="py-12 text-center text-sm text-white/50">
            No items found matching your criteria.
          </div>
        )}
      </div>

      {/* Form Modal */}
      {showForm && (
        <MenuForm
          itemId={editingItem}
          items={items}
          categories={categories}
          onSave={(data) => {
            if (editingItem) {
              updateItem(editingItem, data);
            } else {
              addItem(data);
            }
            setShowForm(false);
            setEditingItem(null);
          }}
          onClose={() => {
            setShowForm(false);
            setEditingItem(null);
          }}
        />
      )}
    </div>
  );
}

function MenuForm({
  itemId,
  items,
  categories,
  onSave,
  onClose,
}: {
  itemId: string | null;
  items: { id: string; name: string; description: string; price: string; priceValue: number; image: string; categoryId: string; badge?: string; badgeVariant?: "default" | "vegan" }[];
  categories: { id: string; title: string }[];
  onSave: (data: { name: string; description: string; price: string; priceValue: number; image: string; categoryId: string; badge?: string; badgeVariant?: "default" | "vegan" }) => void;
  onClose: () => void;
}) {
  const existing = itemId ? items.find((i) => i.id === itemId) : null;

  const [name, setName] = useState(existing?.name || "");
  const [description, setDescription] = useState(existing?.description || "");
  const [price, setPrice] = useState(existing?.priceValue?.toString() || "");
  const [categoryId, setCategoryId] = useState(existing?.categoryId || categories[0]?.id || "");
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
      categoryId,
      image: image || "/placeholder.jpg",
      badge: badge || undefined,
      badgeVariant: badge ? badgeVariant : undefined,
    });
  };

  return (
    <Modal onClose={onClose} title={itemId ? "Edit Item" : "Add Item"}>
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
              <label className="mb-1 block text-sm text-white/50">Category</label>
              <Dropdown
                options={categories.map((cat) => ({ value: cat.id, label: cat.title }))}
                value={categoryId}
                onChange={setCategoryId}
                placeholder="Select category"
              />
            </div>
          </div>
          <div>
            <label className="mb-1 block text-sm text-white/50">Image URL</label>
            <input
              type="url"
              value={image}
              onChange={(e) => setImage(e.target.value)}
              placeholder="https://..."
              className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white placeholder-white/30 outline-none transition-colors focus:border-brand-red/50"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1 block text-sm text-white/50">Badge (optional)</label>
              <input
                type="text"
                value={badge}
                onChange={(e) => setBadge(e.target.value)}
                placeholder="e.g. Popular, New"
                className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white placeholder-white/30 outline-none transition-colors focus:border-brand-red/50"
              />
            </div>
            {badge && (
              <div>
                <label className="mb-1 block text-sm text-white/50">Badge Type</label>
                <Dropdown
                  options={[
                    { value: "default", label: "Default" },
                    { value: "vegan", label: "Vegan" },
                  ]}
                  value={badgeVariant}
                  onChange={(value) => setBadgeVariant(value as "default" | "vegan")}
                  placeholder="Select type"
                />
              </div>
            )}
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="btn-press rounded-lg border border-white/10 px-4 py-2.5 text-sm text-white/50 transition-colors hover:bg-white/5 hover:text-white"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn-press rounded-lg bg-brand-red px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-red-700"
            >
              {itemId ? "Save Changes" : "Add Item"}
            </button>
          </div>
        </form>
    </Modal>
  );
}
