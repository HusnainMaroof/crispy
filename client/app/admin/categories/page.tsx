"use client";

import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { api } from "@/lib/api";
import PageHeader from "@/components/admin/ui/page-header";
import Modal from "@/components/admin/ui/modal";
import { CardGridSkeleton } from "@/components/admin/ui/skeleton";
import { useCategories } from "@/lib/admin/use-categories";

export default function CategoriesPage() {
  const { categories, loading, fetchCategories, addCategory, updateCategory, deleteCategory } = useCategories();
  const [showForm, setShowForm] = useState(false);
  const [editingCategory, setEditingCategory] = useState<string | null>(null);
  const [deletingCategory, setDeletingCategory] = useState<string | null>(null);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  const handleEdit = (id: string) => {
    setEditingCategory(id);
    setShowForm(true);
  };

  const handleDeleteConfirm = async () => {
    if (!deletingCategory) return;
    try {
      await deleteCategory(deletingCategory);
      toast.success("Category deleted");
    } catch {
      toast.error("Failed to delete category");
    } finally {
      setDeletingCategory(null);
    }
  };

  const handleSave = async (data: { title: string; number: string; image: string; itemCount: number }) => {
    try {
      if (editingCategory) {
        await updateCategory(editingCategory, data);
        toast.success("Category updated");
      } else {
        await addCategory(data);
        toast.success("Category added");
      }
      setShowForm(false);
      setEditingCategory(null);
    } catch {
      toast.error(editingCategory ? "Failed to update category" : "Failed to add category");
    }
  };

  return (
    <div className="admin-fade-in">
      <PageHeader
        title="Categories"
        description="Organize your menu items into categories."
        action={
          <button
            onClick={() => {
              setEditingCategory(null);
              setShowForm(true);
            }}
            className="btn-press rounded-lg bg-brand-red px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-red-700"
          >
            Add Category
          </button>
        }
      />

      {loading && <CardGridSkeleton />}

      {/* Categories Grid */}
      {!loading && categories.length === 0 && (
        <div className="rounded-xl border border-white/10 bg-white/5 py-12 text-center">
          <svg className="mx-auto h-12 w-12 text-white/20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
          </svg>
          <h3 className="mt-4 text-sm font-medium text-white">No categories yet</h3>
          <p className="mt-1 text-sm text-white/50">Get started by adding your first category.</p>
          <button
            onClick={() => setShowForm(true)}
            className="btn-press mt-4 inline-flex items-center gap-2 rounded-lg bg-brand-red px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-red-700"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add Category
          </button>
        </div>
      )}

      {!loading && categories.length > 0 && (
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
                  onClick={() => setDeletingCategory(cat.id)}
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
      )}

      {/* Delete Confirmation Modal */}
      {deletingCategory && (
        <Modal
          onClose={() => setDeletingCategory(null)}
          title="Delete Category"
        >
          <p className="mb-6 text-sm text-white/70">
            Are you sure you want to delete <span className="font-medium text-white">{categories.find((c) => c.id === deletingCategory)?.title}</span>? This will also remove all items in this category.
          </p>
          <div className="flex justify-end gap-3">
            <button
              onClick={() => setDeletingCategory(null)}
              className="rounded-lg border border-white/10 px-4 py-2.5 text-sm text-white/50 transition-colors hover:bg-white/5 hover:text-white"
            >
              Cancel
            </button>
            <button
              onClick={handleDeleteConfirm}
              className="rounded-lg bg-brand-red px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-red-700"
            >
              Delete
            </button>
          </div>
        </Modal>
      )}

      {/* Form Modal */}
      {showForm && (
        <CategoryForm
          categoryId={editingCategory}
          categories={categories}
          onSave={handleSave}
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
