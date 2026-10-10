"use client";

import { useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";
import { Check, ImagePlus, Loader2 } from "lucide-react";
import { api } from "@/lib/api";
import PageHeader from "@/app/components/admin/ui/page-header";
import Modal from "@/app/components/admin/ui/modal";
import Dropdown from "@/app/components/admin/ui/dropdown";
import ActionButton from "@/app/components/admin/ui/action-button";
import SearchableSelect from "@/app/components/admin/ui/searchable-select";
import { TableSkeleton } from "@/app/components/admin/ui/skeleton";
import { useMenu } from "@/lib/admin/use-menu";
import { useCategories } from "@/lib/admin/use-categories";
import { useLocations } from "@/lib/admin/use-locations";
import { useAdminSession } from "@/lib/admin/session";
import { isBranchScoped } from "@/lib/admin/roles";
import { dietaryTags, type DietaryOption } from "@/lib/dietary";
import { compressImage } from "@/lib/image-compress";
import type { MenuItemRedirects } from "@/lib/redux/types";
import OptimizedImage from "@/app/components/ui/optimized-image";

/** The three delivery platforms, in the order the popup lists them. */
const REDIRECT_PLATFORMS: { key: keyof MenuItemRedirects; name: string; brand: string }[] = [
  { key: "uberEats", name: "Uber Eats", brand: "#06BB67" },
  { key: "deliveroo", name: "Deliveroo", brand: "#00CCBC" },
  { key: "justEat", name: "Just Eat", brand: "#FF8000" },
];

export default function MenuPage() {
  const { items, loading, error: loadError, fetchItems, addItem, updateItem, deleteItem } = useMenu();
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
  const [deletingItemBusy, setDeletingItemBusy] = useState(false);
  const [removingCategory, setRemovingCategory] = useState(false);
  const [addingCategory, setAddingCategory] = useState(false);

  useEffect(() => {
    void fetchItems();
    void fetchCategories();
    void fetchLocations();
  }, [fetchItems, fetchCategories, fetchLocations]);

  useEffect(() => {
    if (branchScoped && locations[0] && branchFilter === "all") queueMicrotask(() => setBranchFilter(locations[0].id));
  }, [branchScoped, locations, branchFilter]);

  const handleEdit = (id: string) => {
    setEditingItem(id);
    setShowForm(true);
  };

  const handleDeleteConfirm = async () => {
    if (!deletingItem || deletingItemBusy) return;
    setDeletingItemBusy(true);
    try {
      await deleteItem(deletingItem);
      toast.success("Item deleted");
      setDeletingItem(null);
    } catch {
      toast.error("Failed to delete item");
    } finally {
      setDeletingItemBusy(false);
    }
  };

  const handleRemoveCategory = async () => {
    if (!deletingCategory || removingCategory) return;
    setRemovingCategory(true);
    try {
      await deleteCategory(deletingCategory);
      toast.success("Category removed");
      await fetchItems();
      setDeletingCategory(null);
    } catch {
      toast.error("Failed to remove category");
    } finally {
      setRemovingCategory(false);
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
      // Re-read just the menu in the background so the new dish shows up in its
      // real category and sort position. addItem appends to local state, which
      // left it stranded at the end of the list and hidden behind the category
      // and dietary filters that were already applied. Silent, so the list does
      // not flip to a skeleton and lose the filters and scroll position.
      await fetchItems({ silent: true });
      // A branch view is derived from the items, so it has to catch up too.
      if (branchFilter !== "all") void loadBranch(branchFilter);
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
    if (!title || addingCategory) return;
    setAddingCategory(true);
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
    } finally {
      setAddingCategory(false);
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
              <ActionButton
                type="button"
                onClick={() => void saveBranch()}
                busy={savingBranch}
                busyLabel="Saving…"
                disabled={loadingBranch}
                className="rounded-full px-5"
              >
                Save branch
              </ActionButton>
            )}
            {!branchScoped && (
              <ActionButton
                type="button"
                variant="secondary"
                onClick={() => setShowCategoryForm(true)}
                className="rounded-full px-5"
              >
                Add category
              </ActionButton>
            )}
            {!branchScoped && (
              <ActionButton
                type="button"
                onClick={() => openAddItem()}
                className="rounded-full px-5"
              >
                Add item
              </ActionButton>
            )}
          </div>
        }
      />

      {loadError && (
        <p role="alert" className="mb-4 rounded-lg border border-brand-red/40 bg-brand-red/10 px-4 py-3 text-sm text-brand-red">
          {loadError}
        </p>
      )}

      <div className="mb-6 grid gap-3 sm:grid-cols-3">
        <div>
          <label htmlFor="category-filter" className="mb-2 block text-sm text-white/60">
            Category
          </label>
          <SearchableSelect
            id="category-filter"
            value={categoryFilter}
            onChange={setCategoryFilter}
            placeholder="All categories"
            searchPlaceholder="Search categories..."
            emptyLabel="No categories match"
            options={[
              { value: "all", label: "All categories" },
              ...categories.map((category) => ({ value: category.id, label: category.title })),
            ]}
          />
          {/* Deleting a category is destructive and takes its items with it, so it
              is a separate action below the filter rather than a row hidden
              inside the dropdown, where a stray click could hit it. */}
          {!branchScoped && categoryFilter !== "all" && (
            <button
              type="button"
              onClick={() => setDeletingCategory(categoryFilter)}
              className="mt-2 cursor-pointer text-xs text-white/45 underline-offset-4 transition-colors hover:text-brand-red hover:underline"
            >
              Delete “{categories.find((category) => category.id === categoryFilter)?.title}”
            </button>
          )}
        </div>
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
          busy={deletingItemBusy}
        >
          <p className="mb-6 text-sm text-white/70">
            Are you sure you want to delete <span className="font-medium text-white">{items.find((i) => i.id === deletingItem)?.name}</span>? This action cannot be undone.
          </p>
          <div className="flex justify-end gap-3">
            <ActionButton
              variant="secondary"
              onClick={() => setDeletingItem(null)}
              disabled={deletingItemBusy}
            >
              Cancel
            </ActionButton>
            <ActionButton
              variant="danger"
              onClick={() => void handleDeleteConfirm()}
              busy={deletingItemBusy}
              busyLabel="Deleting…"
            >
              Delete
            </ActionButton>
          </div>
        </Modal>
      )}

      {/* Form Modal */}
      {deletingCategory && (
        <Modal onClose={() => setDeletingCategory(null)} title="Remove category" busy={removingCategory}>
          <p className="mb-6 text-sm text-white/70">Remove {categories.find((category) => category.id === deletingCategory)?.title}? Items in it are removed too.</p>
          <div className="flex justify-end gap-3">
            <ActionButton type="button" variant="secondary" onClick={() => setDeletingCategory(null)} disabled={removingCategory}>Cancel</ActionButton>
            <ActionButton
              type="button"
              onClick={() => void handleRemoveCategory()}
              busy={removingCategory}
              busyLabel="Removing…"
            >
              Remove
            </ActionButton>
          </div>
        </Modal>
      )}

      {showCategoryForm && (
        <Modal onClose={() => setShowCategoryForm(false)} title="Add category" busy={addingCategory}>
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
              <ActionButton type="button" variant="secondary" onClick={() => setShowCategoryForm(false)} disabled={addingCategory} className="rounded-full">Cancel</ActionButton>
              <ActionButton type="submit" busy={addingCategory} busyLabel="Adding…" className="rounded-full">Add category</ActionButton>
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
    <ActionButton
      type="button"
      variant="secondary"
      busy={busy}
      busyLabel="Translating…"
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
      className="min-h-0 rounded-full px-3 py-1.5 text-xs whitespace-nowrap"
    >
      Auto-translate
    </ActionButton>
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
  items: { id: string; name: string; nameAr?: string; description: string; descriptionAr?: string; price: string; priceValue: number; image: string; categoryId: string; badge?: string; badgeVariant?: "default" | "vegan"; redirects: MenuItemRedirects; locations: { id: string; name: string }[] }[];
  categories: { id: string; title: string }[];
  locations: { id: string; name: string }[];
  initialCategoryId?: string;
  onSave: (data: { name: string; nameAr: string; description: string; descriptionAr: string; price: string; priceValue: number; image: string; categoryId: string; badge: string | null; badgeVariant: "vegan" | null; redirects: MenuItemRedirects; locationIds: string[] }) => Promise<void>;
  onClose: () => void;
}) {
  const existing = itemId ? items.find((i) => i.id === itemId) : null;

  const [name, setName] = useState(existing?.name || "");
  const [nameAr, setNameAr] = useState(existing?.nameAr || "");
  const [description, setDescription] = useState(existing?.description || "");
  const [descriptionAr, setDescriptionAr] = useState(existing?.descriptionAr || "");
  const [price, setPrice] = useState(existing?.priceValue?.toString() || "");
  const [redirects, setRedirects] = useState<MenuItemRedirects>(
    existing?.redirects ?? { uberEats: "", deliveroo: "", justEat: "" }
  );
  const [categoryId, setCategoryId] = useState(existing?.categoryId || initialCategoryId || categories[0]?.id || "");
  const [image, setImage] = useState(existing?.image || "");
  const [dietary, setDietary] = useState<DietaryOption[]>(dietaryTags(existing?.badge, existing?.badgeVariant));
  // A new dish starts with no branch ticked. Defaulting to every branch meant a
  // dish silently went on sale everywhere the moment it was saved, which is
  // rarely what the person adding it meant.
  const [locationIds, setLocationIds] = useState<string[]>(
    existing ? existing.locations.map((location) => location.id) : []
  );

  const [redirectError, setRedirectError] = useState("");
  const [branchError, setBranchError] = useState("");
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const redirectCount = REDIRECT_PLATFORMS.filter(({ key }) => redirects[key].trim() !== "").length;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;
    // A dish with no branch sells nowhere, so block the save rather than
    // creating a record that will never show up on the storefront.
    if (locationIds.length === 0) {
      setBranchError("Pick at least one branch this dish is sold at.");
      return;
    }
    setBranchError("");
    // Empty is allowed: the storefront falls back to the site-wide platform
    // link. A filled link still has to be https so the customer is not sent
    // to an insecure address.
    const invalid = REDIRECT_PLATFORMS.filter(({ key }) => {
      const value = redirects[key].trim();
      return value !== "" && !/^https:\/\/\S+$/i.test(value);
    });
    if (invalid.length > 0) {
      setRedirectError(`Use a https:// link for ${invalid.map((platform) => platform.name).join(", ")}.`);
      return;
    }
    const priceValue = parseFloat(price) || 0;
    setSubmitting(true);
    try {
      await onSave({
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
        redirects: {
          uberEats: redirects.uberEats.trim(),
          deliveroo: redirects.deliveroo.trim(),
          justEat: redirects.justEat.trim(),
        },
        locationIds,
      });
    } finally {
      setSubmitting(false);
    }
  };

  const toggleBranch = (id: string) => {
    setBranchError("");
    setLocationIds((current) => current.includes(id) ? current.filter((value) => value !== id) : [...current, id]);
  };

  /** Shared by the dropzone and the Replace button so both paths behave the same. */
  const uploadImage = async (file: File) => {
    if (uploading) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", await compressImage(file));
      const { url } = await api.upload<{ url: string; publicId: string }>("/admin/upload", formData);
      setImage(url);
    } catch {
      toast.error("Upload failed");
    } finally {
      setUploading(false);
    }
  };

  return (
    <Modal
      onClose={onClose}
      title={itemId ? "Edit Item" : "Add Item"}
      busy={submitting || uploading}
      size="wide"
    >
      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Dish */}
        <FormSection
          title="Dish"
          description="What the customer reads on the menu."
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="item-name" className="mb-1.5 block text-sm text-white/60">
                Name <span aria-hidden className="text-brand-red">*</span>
              </label>
              <input
                id="item-name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                maxLength={200}
                placeholder="Crispy Chicken Wrap"
                className={inputCls}
              />
            </div>
            <div>
              <div className="mb-1.5 flex items-center justify-between gap-2">
                <label htmlFor="item-name-ar" className="text-sm text-white/60">
                  Name (Arabic)
                </label>
                <TranslateButton source={name} onTranslated={setNameAr} />
              </div>
              <input
                id="item-name-ar"
                type="text"
                dir="rtl"
                value={nameAr}
                onChange={(e) => setNameAr(e.target.value)}
                maxLength={200}
                className={`${inputCls} text-right`}
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="item-description" className="mb-1.5 block text-sm text-white/60">
                Description
              </label>
              <textarea
                id="item-description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                maxLength={600}
                placeholder="Crispy chicken, lettuce, garlic sauce, wrapped in a tortilla."
                className={`${inputCls} h-auto resize-y py-2.5`}
              />
            </div>
            <div>
              <div className="mb-1.5 flex items-center justify-between gap-2">
                <label htmlFor="item-description-ar" className="text-sm text-white/60">
                  Description (Arabic)
                </label>
                <TranslateButton source={description} onTranslated={setDescriptionAr} />
              </div>
              <textarea
                id="item-description-ar"
                dir="rtl"
                value={descriptionAr}
                onChange={(e) => setDescriptionAr(e.target.value)}
                rows={3}
                maxLength={600}
                className={`${inputCls} h-auto resize-y py-2.5 text-right`}
              />
            </div>
          </div>
        </FormSection>

        {/* Listing */}
        <FormSection
          title="Listing"
          description="Where this dish sits and what it costs."
        >
          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <label htmlFor="item-category" className="mb-1.5 block text-sm text-white/60">
                Category <span aria-hidden className="text-brand-red">*</span>
              </label>
              <SearchableSelect
                id="item-category"
                options={categories.map((cat) => ({ value: cat.id, label: cat.title }))}
                value={categoryId}
                onChange={setCategoryId}
                placeholder="Select category"
                searchPlaceholder="Search categories..."
                emptyLabel="No categories match"
              />
            </div>
            <div>
              <label htmlFor="item-price" className="mb-1.5 block text-sm text-white/60">
                Price <span aria-hidden className="text-brand-red">*</span>
              </label>
              <div className="relative">
                <span aria-hidden className="pointer-events-none absolute start-3 top-1/2 -translate-y-1/2 text-sm text-white/40">
                  £
                </span>
                <input
                  id="item-price"
                  type="number"
                  step="0.01"
                  min="0"
                  inputMode="decimal"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  required
                  placeholder="0.00"
                  className={`${inputCls} ps-7 tabular-nums`}
                />
              </div>
            </div>
            <div>
              <label htmlFor="item-dietary" className="mb-1.5 block text-sm text-white/60">
                Dietary
              </label>
              <Dropdown
                id="item-dietary"
                aria-label="Dietary preference"
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
          </div>
        </FormSection>

        {/* Branches. Required, and the one thing a dish cannot be saved without,
            so it sits above the optional stuff rather than at the bottom. */}
        <FormSection
          title="Branches"
          description="One dish, one record. Every ticked branch sells it."
          required
          error={branchError}
        >
          {locations.length === 0 ? (
            <p className="text-sm text-white/45">Add a branch before this dish can be sold.</p>
          ) : (
            <>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="text-xs tabular-nums text-white/45">
                  {locationIds.length === 0
                    ? "None selected yet"
                    : `${locationIds.length} of ${locations.length} selected`}
                </p>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setBranchError("");
                      setLocationIds(locations.map((location) => location.id));
                    }}
                    className="cursor-pointer text-xs text-white/50 underline-offset-4 transition-colors hover:text-white hover:underline"
                  >
                    Select all
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setBranchError("");
                      setLocationIds([]);
                    }}
                    className="cursor-pointer text-xs text-white/50 underline-offset-4 transition-colors hover:text-white hover:underline"
                  >
                    Clear
                  </button>
                </div>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                {locations.map((location) => {
                  const selected = locationIds.includes(location.id);
                  return (
                    <button
                      key={location.id}
                      type="button"
                      aria-pressed={selected}
                      onClick={() => toggleBranch(location.id)}
                      className={`flex cursor-pointer items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs transition-colors ${
                        selected
                          ? "border-brand-red bg-brand-red text-white"
                          : "border-white/10 bg-white/5 text-white/60 hover:border-white/30 hover:bg-white/10 hover:text-white"
                      }`}
                    >
                      {selected && <Check aria-hidden className="size-3" />}
                      {location.name}
                    </button>
                  );
                })}
              </div>
            </>
          )}
        </FormSection>

        {/* Delivery links sit above the photo and stay open. They decide where a
            customer is actually sent, so hiding them behind a toggle meant the
            links quietly went unset and the site-wide link took over. */}
        <div className="rounded-xl border border-white/15 bg-white/[0.04] p-5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="text-sm font-semibold text-white">Delivery platform links</h3>
            <span className="rounded-full bg-white/10 px-2.5 py-1 text-xs tabular-nums text-white/60">
              {redirectCount} of {REDIRECT_PLATFORMS.length} set
            </span>
          </div>
          <p className="mt-1 text-xs leading-relaxed text-white/50">
            Send the customer to this exact dish on that platform. Leave a link empty to use the
            site-wide link for that platform.
          </p>
          <div className="mt-4 grid gap-4 sm:grid-cols-3">
            {REDIRECT_PLATFORMS.map(({ key, name, brand }) => (
              <div key={key}>
                <label
                  htmlFor={`redirect-${key}`}
                  className="mb-1.5 flex items-center gap-2 text-xs text-white/60"
                >
                  <span
                    aria-hidden
                    className="inline-flex size-5 items-center justify-center rounded-full text-[9px] font-bold text-white"
                    style={{ backgroundColor: brand }}
                  >
                    {name.charAt(0)}
                  </span>
                  {name}
                </label>
                <input
                  id={`redirect-${key}`}
                  type="url"
                  inputMode="url"
                  value={redirects[key]}
                  onChange={(e) => {
                    setRedirects((current) => ({ ...current, [key]: e.target.value }));
                    setRedirectError("");
                  }}
                  placeholder="https://…"
                  className={inputCls}
                />
              </div>
            ))}
          </div>
          {redirectError && (
            <p
              role="alert"
              className="mt-3 rounded-lg border border-brand-red/40 bg-brand-red/10 px-3 py-2 text-xs text-brand-red"
            >
              {redirectError}
            </p>
          )}
        </div>

        {/* Photo */}
        <FormSection
          title="Photo"
          description="Shown on the menu card. Landscape works best."
        >
          {image ? (
            <div className="relative overflow-hidden rounded-xl border border-white/10">
              <OptimizedImage
                src={image}
                alt="Preview"
                width={500}
                height={192}
                className="h-48 w-full object-cover"
              />
              <div className="absolute end-2 top-2 flex gap-2">
                <label
                  className={`rounded-lg bg-black/70 px-3 py-1.5 text-xs text-white/85 backdrop-blur transition-colors ${
                    uploading ? "cursor-progress opacity-50" : "cursor-pointer hover:bg-black/90 hover:text-white"
                  }`}
                >
                  {uploading ? "Uploading…" : "Replace"}
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/avif"
                    disabled={uploading}
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      // Reset so picking the same file twice still fires change.
                      e.target.value = "";
                      if (file) void uploadImage(file);
                    }}
                  />
                </label>
                <button
                  type="button"
                  disabled={uploading}
                  onClick={() => setImage("")}
                  className="cursor-pointer rounded-lg bg-black/70 px-3 py-1.5 text-xs text-white/85 backdrop-blur transition-colors hover:bg-brand-red/80 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Remove
                </button>
              </div>
              {uploading && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/70">
                  <span className="flex items-center gap-2 text-sm text-white">
                    <Loader2 aria-hidden className="size-4 animate-spin" />
                    Uploading…
                  </span>
                </div>
              )}
            </div>
          ) : (
            <label
              className={`flex h-40 cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-white/10 bg-white/[0.03] transition-colors ${
                uploading ? "cursor-progress opacity-60" : "hover:border-white/30 hover:bg-white/[0.06]"
              }`}
            >
              {uploading ? (
                <>
                  <Loader2 aria-hidden className="size-7 animate-spin text-white/40" />
                  <p className="text-sm text-white/70">Uploading image…</p>
                </>
              ) : (
                <>
                  <ImagePlus aria-hidden className="size-7 text-white/30" />
                  <p className="text-sm text-white/60">Click to upload an image</p>
                  <p className="text-xs text-white/35">JPEG, PNG, WebP or AVIF</p>
                </>
              )}
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp,image/avif"
                disabled={uploading}
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  e.target.value = "";
                  if (file) void uploadImage(file);
                }}
              />
            </label>
          )}
        </FormSection>

        {/* Sticky so Save stays reachable however far down the form you are. */}
        <div className="sticky bottom-0 -mx-6 -mb-6 flex flex-wrap items-center justify-between gap-3 border-t border-white/10 bg-[#0b0b0b]/95 px-6 py-4 backdrop-blur">
          <p className="text-xs text-white/40">
            {locationIds.length === 0
              ? "Pick at least one branch to save"
              : `Will be sold at ${locationIds.length} ${locationIds.length === 1 ? "branch" : "branches"}`}
          </p>
          <div className="flex gap-3">
            <ActionButton
              type="button"
              variant="secondary"
              onClick={onClose}
              disabled={submitting}
            >
              Cancel
            </ActionButton>
            <ActionButton
              type="submit"
              // A second click while the save is in flight would create the dish twice.
              busy={submitting}
              busyLabel={itemId ? "Saving…" : "Adding…"}
              disabled={uploading || locationIds.length === 0}
            >
              {itemId ? "Save Changes" : "Add Item"}
            </ActionButton>
          </div>
        </div>
      </form>
    </Modal>
  );
}

const inputCls =
  "w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white outline-none transition-colors placeholder:text-white/30 hover:border-white/20 focus:border-brand-red/60 focus:ring-2 focus:ring-brand-red/25 disabled:opacity-50";

/** Titled block so the long form reads as four short ones. */
function FormSection({
  title,
  description,
  required,
  error,
  children,
}: {
  title: string;
  description: string;
  required?: boolean;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <fieldset className="space-y-3 border-t border-white/10 pt-6 first:border-0 first:pt-0">
      <div>
        <legend className="text-sm font-semibold tracking-wide text-white">
          {title}
          {required && <span aria-hidden className="ms-1 text-brand-red">*</span>}
        </legend>
        <p className="mt-0.5 text-xs leading-relaxed text-white/45">{description}</p>
      </div>
      {children}
      {error && (
        <p role="alert" className="rounded-lg border border-brand-red/40 bg-brand-red/10 px-3 py-2 text-xs text-brand-red">
          {error}
        </p>
      )}
    </fieldset>
  );
}
