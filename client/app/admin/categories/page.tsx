"use client";

import { useState } from "react";
import PageHeader from "@/components/admin/ui/page-header";
import Modal from "@/components/admin/ui/modal";
import { useCategories } from "@/lib/admin/use-categories";

export default function CategoriesPage() {
  const { categories, addCategory, updateCategory, deleteCategory } = useCategories();
  const [showForm, setShowForm] = useState(false);
  const [editingCategory, setEditingCategory] = useState<string | null>(null);

  const handleEdit = (id: string) => {
    setEditingCategory(id);
    setShowForm(true);
  };

  const handleDelete = (id: string) => {
    if (confirm("Are you sure you want to delete this category?")) {
      deleteCategory(id);
    }
  };

  return (
    <div>
      <PageHeader
        title="Categories"
        description="Organize your menu items into categories."
        action={
          <button
            onClick={() => {
              setEditingCategory(null);
              setShowForm(true);
            }}
            className="rounded-lg bg-brand-red px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-red-700"
          >
            Add Category
          </button>
        }
      />

      {/* Categories Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {categories.map((cat) => (
          <div
            key={cat.id}
            className="group rounded-xl border border-white/10 bg-white/5 p-6 transition-colors hover:bg-white/10"
          >
            <div className="mb-4 flex items-start justify-between">
              <div>
                <span className="font-display text-4xl tracking-wide text-white/20">
                  {cat.number}
                </span>
                <h3 className="mt-1 font-display text-xl tracking-wide text-white">
                  {cat.title}
                </h3>
              </div>
              <div className="flex gap-2 opacity-0 transition-opacity group-hover:opacity-100">
                <button
                  onClick={() => handleEdit(cat.id)}
                  className="rounded-lg p-2 text-white/50 hover:bg-white/10 hover:text-white"
                >
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </button>
                <button
                  onClick={() => handleDelete(cat.id)}
                  className="rounded-lg p-2 text-white/50 hover:bg-brand-red/20 hover:text-brand-red"
                >
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            </div>
            <p className="text-sm text-white/50">
              {cat.itemCount} {cat.itemCount === 1 ? "item" : "items"}
            </p>
          </div>
        ))}
      </div>

      {/* Form Modal */}
      {showForm && (
        <CategoryForm
          categoryId={editingCategory}
          categories={categories}
          onSave={(data) => {
            if (editingCategory) {
              updateCategory(editingCategory, data);
            } else {
              addCategory(data);
            }
            setShowForm(false);
            setEditingCategory(null);
          }}
          onClose={() => {
            setShowForm(false);
            setEditingCategory(null);
          }}
        />
      )}
    </div>
  );
}

function CategoryForm({
  categoryId,
  categories,
  onSave,
  onClose,
}: {
  categoryId: string | null;
  categories: { id: string; title: string; number: string; image: string; itemCount: number }[];
  onSave: (data: { title: string; number: string; image: string; itemCount: number }) => void;
  onClose: () => void;
}) {
  const existing = categoryId ? categories.find((c) => c.id === categoryId) : null;

  const [title, setTitle] = useState(existing?.title || "");
  const [number, setNumber] = useState(existing?.number || "");
  const [image, setImage] = useState(existing?.image || "");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      title,
      number: number || String(categories.length + 1).padStart(2, "0"),
      image: image || "/placeholder.jpg",
      itemCount: existing?.itemCount || 0,
    });
  };

  return (
    <Modal onClose={onClose} title={categoryId ? "Edit Category" : "Add Category"}>
      <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm text-white/50">Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white outline-none focus:border-brand-red/50"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm text-white/50">Number (for ordering)</label>
            <input
              type="text"
              value={number}
              onChange={(e) => setNumber(e.target.value)}
              placeholder="01"
              className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white placeholder-white/30 outline-none focus:border-brand-red/50"
            />
          </div>
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
              {categoryId ? "Save Changes" : "Add Category"}
            </button>
          </div>
        </form>
    </Modal>
  );
}
