"use client";

import { useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";
import { api } from "@/lib/api";
import PageHeader from "@/app/components/admin/ui/page-header";
import Modal from "@/app/components/admin/ui/modal";
import Dropdown from "@/app/components/admin/ui/dropdown";
import { TableSkeleton } from "@/app/components/admin/ui/skeleton";
import { useMenu } from "@/lib/admin/use-menu";
import { useCategories } from "@/lib/admin/use-categories";
import { useLocations } from "@/lib/admin/use-locations";
import { useAdminSession } from "@/lib/admin/session";
import { isBranchScoped } from "@/lib/admin/roles";
import { dietaryTags, type DietaryOption } from "@/lib/dietary";
import OptimizedImage from "@/app/components/ui/optimized-image";

export default function MenuPage() {
  const { items, loading, fetchItems, addItem, updateItem, deleteItem } = useMenu();
  const { categories, loading: categoriesLoading, fetchCategories, addCategory, deleteCategory } = useCategories();
  const { locations, loading: locationsLoading, fetchLocations } = useLocations();
  const { user } = useAdminSession();
  const branchScoped = user ? isBranchScoped(user.role) : false;
  const canEditBranch = user?.role === "superadmin" || user?.role === "branch_manager";
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [branchFilter, setBranchFilter] = useState("all");
  const [dietaryFilter, setDietaryFilter] = useState("all");
  const [branchRows, setBranchRows] = useState<{ id: string; name: string; categoryId: string; globalPrice: number; onBranch: boolean; price: string }[]>([]);
  const [loadingBranch, setLoadingBranch] = useState(false);
  const [savingBranch, setSavingBranch] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState<string | null>(null);
  const [newItemCategoryId, setNewItemCategoryId] = useState("");
  const [deletingItem, setDeletingItem] = useState<string | null>(null);
  const [showCategoryForm, setShowCategoryForm] = useState(false);
  const [categoryTitle, setCategoryTitle] = useState("");
  const [categoryTitleAr, setCategoryTitleAr] = useState("");
  const [deletingCategory, setDeletingCategory] = useState<string | null>(null);

  useEffect(() => {
    fetchItems();
    fetchCategories();
    fetchLocations();
  }, [fetchItems, fetchCategories, fetchLocations]);

  useEffect(() => {
    if (branchScoped && locations[0] && branchFilter === "all") queueMicrotask(() => setBranchFilter(locations[0].id));
  }, [branchScoped, locations, branchFilter]);

  const handleEdit = (id: string) => {
    setEditingItem(id);
    setShowForm(true);
  };

  const handleDeleteConfirm = async () => {
    if (!deletingItem) return;
    try {
      await deleteItem(deletingItem);
      toast.success("Item deleted");
    } catch {
      toast.error("Failed to delete item");
    } finally {
      setDeletingItem(null);
    }
  };

  const handleSave = async (data: Parameters<typeof addItem>[0]) => {
    try {
      if (editingItem) {
        await updateItem(editingItem, data);
        toast.success("Item updated");
      } else {
        await addItem(data);
        toast.success("Item added");
      }
      setShowForm(false);
      setEditingItem(null);
    } catch {
      toast.error(editingItem ? "Failed to update item" : "Failed to add item");
    }
  };

  const loadBranch = useCallback(async (id: string) => {
    setLoadingBranch(true);
    try {
      const assigned = await api.get<Record<string, unknown>[]>(`/admin/locations/${id}/menu`);
      const byId = new Map(assigned.map((row) => [String(row.menu_item_id), row]));
      setBranchRows(items.map((item) => {
        const current = byId.get(item.id);
        return {
          id: item.id,
          name: item.name,
          categoryId: item.categoryId,
          globalPrice: item.priceValue,
          onBranch: Boolean(current?.available),
          price: current?.price == null || current?.price === undefined ? "" : String(current.price),
        };
      }));
    } catch {
      toast.error("Could not load this branch menu");
      setBranchRows([]);
    } finally {
      setLoadingBranch(false);
    }
  }, [items]);

  useEffect(() => {
    if (branchFilter !== "all" && !loading) queueMicrotask(() => { void loadBranch(branchFilter); });
  }, [branchFilter, loading, loadBranch]);

  const saveBranch = async () => {
    if (branchFilter === "all") return;
    setSavingBranch(true);
    try {
      await api.put(`/admin/locations/${branchFilter}/menu`, {
        replace: true,
        items: branchRows.filter((row) => row.onBranch).map((row) => ({
          menu_item_id: row.id,
          available: true,
          price: row.price.trim() === "" ? null : Number(row.price),
        })),
      });
      toast.success("Branch menu saved");
      await loadBranch(branchFilter);
      await fetchItems();
    } catch {
      toast.error("Could not save this branch menu");
    } finally {
      setSavingBranch(false);
    }
  };

  const openAddItem = (categoryId = categoryFilter !== "all" ? categoryFilter : categories[0]?.id ?? "") => {
    if (categories.length === 0) {
      setShowCategoryForm(true);
      return;
    }
    setEditingItem(null);
    setNewItemCategoryId(categoryId);
    setShowForm(true);
  };

  const handleAddCategory = async (event: React.FormEvent) => {
    event.preventDefault();
    const title = categoryTitle.trim();
    if (!title) return;
    try {
      await addCategory({
        title,
        titleAr: categoryTitleAr.trim(),
        number: String(categories.length + 1).padStart(2, "0"),
        image: "https://res.cloudinary.com/demo/image/upload/sample.jpg",
      });
      toast.success("Category added");
      setCategoryTitle("");
      setCategoryTitleAr("");
      setShowCategoryForm(false);
      await fetchCategories();
    } catch {
      toast.error("Failed to add category");
    }
  };

  return (
    <div className="admin-fade-in">
      <PageHeader
        title="Menu"
        description="One dish, stored once. Choose a category and a branch to see what that shop sells."
        action={
          <div className="flex flex-wrap gap-2">
            {canEditBranch && branchFilter !== "all" && (
              <button
                type="button"
                onClick={() => void saveBranch()}
                disabled={savingBranch || loadingBranch}
                className="btn-press rounded-full bg-[#FF0931] px-5 py-2.5 text-sm font-medium text-white disabled:opacity-60"
              >
                {savingBranch ? "Saving..." : "Save branch"}
              </button>
            )}
            {!branchScoped && (
              <button
                type="button"
                onClick={() => setShowCategoryForm(true)}
                className="btn-press rounded-full border border-white/15 px-5 py-2.5 text-sm text-white/80 transition-colors hover:bg-white/10"
              >
                Add category
              </button>
            )}
            {!branchScoped && (
              <button
                type="button"
                onClick={() => openAddItem()}
                className="btn-press rounded-full bg-brand-red px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-red-700"
              >
                Add item
              </button>
            )}
          </div>
        }
      />

      <div className="mb-6 grid gap-3 sm:grid-cols-3">
        <label className="block text-sm text-white/60">
          Category
          <Dropdown
            className="mt-2"
            value={categoryFilter}
            onChange={setCategoryFilter}
            options={[
              { value: "all", label: "All categories" },
              ...categories.map((category) => ({ value: category.id, label: category.title })),
            ]}
          />
        </label>
        <label className="block text-sm text-white/60">
          Branch
          <Dropdown
            className="mt-2"
            value={branchFilter}
            onChange={setBranchFilter}
            options={[
              ...(branchScoped ? [] : [{ value: "all", label: "All branches" }]),
              ...locations.map((location) => ({ value: location.id, label: location.name })),
            ]}
          />
        </label>
        <label className="block text-sm text-white/60">
          Dietary preference
          <Dropdown
            className="mt-2"
            value={dietaryFilter}
            onChange={setDietaryFilter}
            options={[
              { value: "all", label: "All" },
              { value: "Halal", label: "Halal" },
              { value: "Vegan", label: "Vegan" },
              { value: "Vegetarian", label: "Vegetarian" },
            ]}
          />
        </label>
      </div>

      {(loading || categoriesLoading || locationsLoading || loadingBranch) ? <TableSkeleton /> : (
        <MenuList
          branchFilter={branchFilter}
          categoryFilter={categoryFilter}
          dietaryFilter={dietaryFilter}
          categories={categories}
          locations={locations}
          items={items}
          branchRows={branchRows}
          canEditBranch={canEditBranch}
          onBranchRows={setBranchRows}
          onEdit={handleEdit}
          onDelete={setDeletingItem}
          onRemoveCategory={branchScoped ? undefined : setDeletingCategory}
        />
      )}

      {/* Delete Confirmation Modal */}
      {deletingItem && (
        <Modal
          onClose={() => setDeletingItem(null)}
          title="Delete Item"
        >
          <p className="mb-6 text-sm text-white/70">
            Are you sure you want to delete <span className="font-medium text-white">{items.find((i) => i.id === deletingItem)?.name}</span>? This action cannot be undone.
          </p>
          <div className="flex justify-end gap-3">
            <button
              onClick={() => setDeletingItem(null)}
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
      {deletingCategory && (
        <Modal onClose={() => setDeletingCategory(null)} title="Remove category">
          <p className="mb-6 text-sm text-white/70">Remove {categories.find((category) => category.id === deletingCategory)?.title}? Items in it are removed too.</p>
          <div className="flex justify-end gap-3">
            <button type="button" onClick={() => setDeletingCategory(null)} className="rounded-full border border-white/10 px-4 py-2.5 text-sm text-white/60">Cancel</button>
            <button
              type="button"
              onClick={async () => {
                try {
                  await deleteCategory(deletingCategory);
                  toast.success("Category removed");
                  await fetchItems();
                } catch {
                  toast.error("Failed to remove category");
                } finally {
                  setDeletingCategory(null);
                }
              }}
              className="rounded-full bg-[#FF0931] px-4 py-2.5 text-sm text-white"
            >
              Remove
            </button>
          </div>
        </Modal>
      )}

      {showCategoryForm && (
        <Modal onClose={() => setShowCategoryForm(false)} title="Add category">
          <form onSubmit={handleAddCategory} className="space-y-4">
            <label className="block text-sm text-white/60">
              Name
              <input value={categoryTitle} onChange={(event) => setCategoryTitle(event.target.value)} required className="mt-2 w-full rounded-xl border border-white/10 bg-black px-3 py-2.5 text-sm text-white outline-none focus:border-[#FF0931]" placeholder="Chickens" />
            </label>
            <div className="block text-sm text-white/60">
              <div className="flex items-center justify-between gap-2">
                <span>Name (Arabic)</span>
                <TranslateButton source={categoryTitle} onTranslated={setCategoryTitleAr} />
              </div>
              <input dir="rtl" value={categoryTitleAr} onChange={(event) => setCategoryTitleAr(event.target.value)} className="mt-2 w-full rounded-xl border border-white/10 bg-black px-3 py-2.5 text-sm text-white outline-none focus:border-[#FF0931]" placeholder="الدجاج" />
            </div>
            <div className="flex justify-end gap-3">
              <button type="button" onClick={() => setShowCategoryForm(false)} className="rounded-full border border-white/10 px-4 py-2.5 text-sm text-white/60">Cancel</button>
              <button type="submit" className="rounded-full bg-[#FF0931] px-4 py-2.5 text-sm text-white">Add category</button>
            </div>
          </form>
        </Modal>
      )}

      {showForm && (
        <MenuForm
          itemId={editingItem}
          items={items}
          categories={categories}
          locations={locations}
          initialCategoryId={newItemCategoryId}
          onSave={handleSave}
          onClose={() => {
            setShowForm(false);
            setEditingItem(null);
          }}
        />
      )}
    </div>
  );
}

function MenuList({
  branchFilter,
  categoryFilter,
  dietaryFilter,
  categories,
  locations,
  items,
  branchRows,
  canEditBranch,
  onBranchRows,
  onEdit,
  onDelete,
  onRemoveCategory,
}: {
  branchFilter: string;
  categoryFilter: string;
  dietaryFilter: string;
  categories: { id: string; title: string }[];
  locations: { id: string; name: string }[];
  items: { id: string; name: string; price: string; priceValue: number; image: string; categoryId: string; badge?: string; badgeVariant?: "default" | "vegan"; locations: { id: string; name: string }[] }[];
  branchRows: { id: string; name: string; categoryId: string; globalPrice: number; onBranch: boolean; price: string }[];
  canEditBranch: boolean;
  onBranchRows: React.Dispatch<React.SetStateAction<{ id: string; name: string; categoryId: string; globalPrice: number; onBranch: boolean; price: string }[]>>;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  onRemoveCategory?: (id: string) => void;
}) {
  const categoryName = categories.find((category) => category.id === categoryFilter)?.title;
  const matchesDiet = (badge?: string, badgeVariant?: "default" | "vegan") =>
    dietaryFilter === "all" || dietaryTags(badge, badgeVariant).some((tag) => tag.toLowerCase() === dietaryFilter.toLowerCase());
  const catalogue = items.filter((item) => (categoryFilter === "all" || item.categoryId === categoryFilter) && matchesDiet(item.badge, item.badgeVariant));
  const rows = branchRows.filter((row) => {
    const item = items.find((entry) => entry.id === row.id);
    return (categoryFilter === "all" || row.categoryId === categoryFilter) && matchesDiet(item?.badge, item?.badgeVariant);
  });

  if (items.length === 0 && categories.length === 0) {
    return <p className="rounded-2xl border border-white/10 px-5 py-10 text-center text-sm text-white/50">No categories yet. Add one to start the menu.</p>;
  }

  if (branchFilter !== "all") {
    const onCount = rows.filter((row) => row.onBranch).length;
    return (
      <div className="space-y-3">
        <p className="text-sm text-white/50">{onCount} {onCount === 1 ? "dish" : "dishes"} on this branch{categoryName ? ` in ${categoryName}` : ""}.</p>
        {rows.length === 0 && <p className="rounded-2xl border border-white/10 px-5 py-10 text-center text-sm text-white/50">No dishes in this view.</p>}
        <ul className="divide-y divide-white/5 overflow-hidden rounded-2xl border border-white/10">
          {rows.map((row) => (
            <li key={row.id} className="flex flex-wrap items-center gap-3 px-4 py-3">
              {canEditBranch ? <button
                type="button"
                aria-pressed={row.onBranch}
                onClick={() => onBranchRows((current) => current.map((item) => item.id === row.id ? { ...item, onBranch: !item.onBranch } : item))}
                className={`h-9 cursor-pointer rounded-full px-3 text-xs font-bold uppercase tracking-widest ${row.onBranch ? "bg-green-500/20 text-green-300" : "bg-white/10 text-white/45"}`}
              >
                {row.onBranch ? "On this branch" : "Not on this branch"}
              </button> : <span className="text-xs text-white/60">{row.onBranch ? "Available" : "Unavailable"}</span>}
              <span className="min-w-0 flex-1 truncate text-sm text-white">{row.name}</span>
              <span className="text-xs text-white/40">Shared £{row.globalPrice.toFixed(2)}</span>
              {canEditBranch ? <input
                value={row.price}
                disabled={!row.onBranch}
                placeholder="Same price"
                inputMode="decimal"
                aria-label={`${row.name} price`}
                onChange={(event) => onBranchRows((current) => current.map((item) => item.id === row.id ? { ...item, price: event.target.value } : item))}
                className="h-10 w-28 rounded-xl border border-white/10 bg-black px-3 text-sm text-white outline-none focus:border-[#FF0931] disabled:opacity-40"
              /> : <span className="text-xs text-white/60">{row.price ? `£${Number(row.price).toFixed(2)}` : "Standard price"}</span>}
            </li>
          ))}
        </ul>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {categoryFilter !== "all" && onRemoveCategory && (
        <div className="flex justify-end">
          <button type="button" onClick={() => onRemoveCategory(categoryFilter)} className="cursor-pointer text-xs text-white/40 hover:text-[#FF0931]">Remove {categoryName}</button>
        </div>
      )}
      {catalogue.length === 0 && <p className="rounded-2xl border border-white/10 px-5 py-10 text-center text-sm text-white/50">No dishes in this view.</p>}
      <ul className="divide-y divide-white/5 overflow-hidden rounded-2xl border border-white/10">
        {catalogue.map((item) => {
          const tags = dietaryTags(item.badge, item.badgeVariant);
          const branchLabel = item.locations.length === 0
            ? "Not on a branch yet"
            : item.locations.length === locations.length && locations.length > 0
              ? "All branches"
              : item.locations.map((location) => location.name).join(", ");
          return (
            <li key={item.id} className="flex items-center gap-3 px-4 py-3">
              <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-lg">
                <OptimizedImage src={item.image} alt="" fill sizes="48px" className="object-cover" blur={false} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm text-white">{item.name}</p>
                <p className="truncate text-xs text-white/45">{item.price}{tags.length > 0 ? ` · ${tags.join(", ")}` : ""} · {branchLabel}</p>
              </div>
              <button type="button" onClick={() => onEdit(item.id)} className="cursor-pointer text-xs text-white/50 hover:text-white">Edit</button>
              <button type="button" onClick={() => onDelete(item.id)} className="cursor-pointer text-xs text-white/40 hover:text-[#FF0931]">Delete</button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

/** Fills the Arabic field from the English one via POST /api/admin/translate. */
function TranslateButton({ source, onTranslated }: { source: string; onTranslated: (value: string) => void }) {
  const [busy, setBusy] = useState(false);
  return (
    <button
      type="button"
      disabled={busy}
      onClick={async () => {
        if (!source.trim()) {
          toast.error("Type the English text first");
          return;
        }
        setBusy(true);
        try {
          const { translated } = await api.post<{ translated: string }>("/admin/translate", { text: source.trim() });
          onTranslated(translated);
        } catch {
          toast.error("Could not translate right now");
        } finally {
          setBusy(false);
        }
      }}
      className="cursor-pointer rounded-full border border-white/15 px-3 py-1 text-xs whitespace-nowrap text-white/70 transition-colors hover:border-white/30 hover:bg-white/10 hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
    >
      {busy ? "Translating…" : "Auto-translate"}
    </button>
  );
}

function MenuForm({
  itemId,
  items,
  categories,
  locations,
  initialCategoryId = "",
  onSave,
  onClose,
}: {
  itemId: string | null;
  items: { id: string; name: string; nameAr?: string; description: string; descriptionAr?: string; price: string; priceValue: number; image: string; categoryId: string; badge?: string; badgeVariant?: "default" | "vegan"; redirectUrl?: string; locations: { id: string; name: string }[] }[];
  categories: { id: string; title: string }[];
  locations: { id: string; name: string }[];
  initialCategoryId?: string;
  onSave: (data: { name: string; nameAr: string; description: string; descriptionAr: string; price: string; priceValue: number; image: string; categoryId: string; badge: string | null; badgeVariant: "vegan" | null; redirectUrl: string; locationIds: string[] }) => void;
  onClose: () => void;
}) {
  const existing = itemId ? items.find((i) => i.id === itemId) : null;

  const [name, setName] = useState(existing?.name || "");
  const [nameAr, setNameAr] = useState(existing?.nameAr || "");
  const [description, setDescription] = useState(existing?.description || "");
  const [descriptionAr, setDescriptionAr] = useState(existing?.descriptionAr || "");
  const [price, setPrice] = useState(existing?.priceValue?.toString() || "");
  const [redirectUrl, setRedirectUrl] = useState(existing?.redirectUrl || "");
  const [categoryId, setCategoryId] = useState(existing?.categoryId || initialCategoryId || categories[0]?.id || "");
  const [image, setImage] = useState(existing?.image || "");
  const [dietary, setDietary] = useState<DietaryOption[]>(dietaryTags(existing?.badge, existing?.badgeVariant));
  const [locationIds, setLocationIds] = useState<string[]>(
    existing ? existing.locations.map((location) => location.id) : locations.map((location) => location.id)
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const priceValue = parseFloat(price) || 0;
    onSave({
      name,
      nameAr,
      description,
      descriptionAr,
      price: `£${priceValue.toFixed(2)}`,
      priceValue,
      categoryId,
      image: image || "/placeholder.jpg",
      badge: dietary.length > 0 ? dietary.join(", ") : null,
      badgeVariant: dietary.includes("Vegan") ? "vegan" : null,
      redirectUrl: redirectUrl.trim(),
      locationIds,
    });
  };

  const toggleBranch = (id: string) => {
    setLocationIds((current) => current.includes(id) ? current.filter((value) => value !== id) : [...current, id]);
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
            <div className="mb-1 flex items-center justify-between gap-2">
              <label className="block text-sm text-white/50">Name (Arabic)</label>
              <TranslateButton source={name} onTranslated={setNameAr} />
            </div>
            <input
              type="text"
              dir="rtl"
              value={nameAr}
              onChange={(e) => setNameAr(e.target.value)}
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
          <div>
            <div className="mb-1 flex items-center justify-between gap-2">
              <label className="block text-sm text-white/50">Description (Arabic)</label>
              <TranslateButton source={description} onTranslated={setDescriptionAr} />
            </div>
            <textarea
              dir="rtl"
              value={descriptionAr}
              onChange={(e) => setDescriptionAr(e.target.value)}
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
            <label className="mb-1 block text-sm text-white/50">Redirect link (optional)</label>
            <input
              type="url"
              value={redirectUrl}
              onChange={(e) => setRedirectUrl(e.target.value)}
              placeholder="https://…"
              className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white outline-none focus:border-brand-red/50"
            />
            <p className="mt-1 text-xs leading-relaxed text-white/40">For the redirect system: after the customer picks a branch and an app, Continue opens this link instead of the app link. Leave empty to use the app link.</p>
          </div>
          <div>
            <label className="mb-1 block text-sm text-white/50">Image</label>
            {image ? (
              <div className="relative overflow-hidden rounded-lg border border-white/10">
                <OptimizedImage
                  src={image}
                  alt="Preview"
                  width={500}
                  height={192}
                  className="h-48 w-full object-cover"
                />
                <div className="absolute right-2 top-2 flex gap-2">
                  <label className="cursor-pointer rounded-lg bg-black/60 px-3 py-1.5 text-xs text-white/80 transition-colors hover:bg-black/80 hover:text-white">
                    Replace
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp,image/avif"
                      className="hidden"
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        const formData = new FormData();
                        formData.append("file", file);
                        try {
                          const { url } = await api.upload<{ url: string; publicId: string }>("/admin/upload", formData);
                          setImage(url);
                        } catch {
                          toast.error("Upload failed");
                        }
                      }}
                    />
                  </label>
                  <button
                    type="button"
                    onClick={() => setImage("")}
                    className="rounded-lg bg-black/60 px-3 py-1.5 text-xs text-white/80 transition-colors hover:bg-brand-red/80 hover:text-white"
                  >
                    Remove
                  </button>
                </div>
              </div>
            ) : (
              <label className="flex cursor-pointer items-center justify-center rounded-lg border-2 border-dashed border-white/10 bg-white/5 h-32 transition-colors hover:border-white/30 hover:bg-white/10">
                <div className="text-center">
                  <svg className="mx-auto h-8 w-8 text-white/30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <p className="mt-2 text-sm text-white/50">Click to upload image</p>
                </div>
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/avif"
                  className="hidden"
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    const formData = new FormData();
                    formData.append("file", file);
                    try {
                      const { url } = await api.upload<{ url: string; publicId: string }>("/admin/upload", formData);
                      setImage(url);
                    } catch {
                      toast.error("Upload failed");
                    }
                  }}
                />
              </label>
            )}
          </div>
          <div>
            <label className="mb-1 block text-sm text-white/50">Dietary preference</label>
            <Dropdown
              options={[
                { value: "none", label: "None" },
                { value: "Halal", label: "Halal" },
                { value: "Vegan", label: "Vegan" },
                { value: "Vegetarian", label: "Vegetarian" },
                { value: "Halal,Vegan", label: "Halal and Vegan" },
                { value: "Halal,Vegetarian", label: "Halal and Vegetarian" },
                { value: "Vegan,Vegetarian", label: "Vegetarian and Vegan" },
                { value: "Halal,Vegan,Vegetarian", label: "Halal, Vegan and Vegetarian" },
              ]}
              value={dietary.length === 0 ? "none" : [...dietary].sort().join(",")}
              onChange={(value) => setDietary(value === "none" ? [] : value.split(",") as DietaryOption[])}
              placeholder="Dietary preference"
            />
          </div>
          <fieldset>
            <legend className="mb-2 text-sm text-white/50">Sold at</legend>
            {locations.length === 0 ? (
              <p className="text-sm text-white/45">Add a branch before this dish can be sold.</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {locations.map((location) => {
                  const selected = locationIds.includes(location.id);
                  return (
                    <button
                      key={location.id}
                      type="button"
                      aria-pressed={selected}
                      onClick={() => toggleBranch(location.id)}
                      className={`cursor-pointer rounded-full px-3 py-1.5 text-xs ${selected ? "bg-[#FF0931] text-white" : "bg-white/10 text-white/55"}`}
                    >
                      {location.name}
                    </button>
                  );
                })}
              </div>
            )}
            <p className="mt-2 text-xs text-white/40">The same dish stays one record. Each ticked branch sells it.</p>
          </fieldset>
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
