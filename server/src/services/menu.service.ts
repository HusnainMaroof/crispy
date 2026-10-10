import { Prisma } from "../generated/prisma/client.js";
import { getPrisma, getReadPrisma } from "../config/prisma.js";
import { NotFoundException } from "../utils/app-error.js";
import { rethrow, serialize } from "../utils/db.js";
import { cachedJson, invalidateCatalogueCache, TTL_MENU_SECONDS } from "../utils/cache.js";
import { destroyCloudinaryAsset } from "./upload.service.js";
import type { MenuCategory, MenuItem, Deal } from "../types/models.js";

export interface CategoryWithItems extends MenuCategory {
  items: MenuItem[];
}

/** `read` routes lag-tolerant public reads to the replica. Default: primary. */
function db(read?: boolean) {
  return read ? getReadPrisma() : getPrisma();
}

/** Only the two columns the menu needs to decide scope — not the whole row. */
async function findActiveLocation(locationId: string, read?: boolean) {
  return db(read).locations.findUnique({
    where: { id: locationId },
    select: { id: true, status: true },
  });
}

async function resolveBranch(scope?: { locationId: string; required: boolean }, read?: boolean) {
  if (!scope) return null;
  const location = await findActiveLocation(scope.locationId, read);
  if (!location || location.status !== "active") {
    if (scope.required) throw new NotFoundException("Location not found");
    return null;
  }
  return location;
}

// The storefront maps exactly these fields; leaving created_at/updated_at and
// the relation ids out keeps the payload small on a hot, public endpoint.
const CATEGORY_SELECT = {
  id: true,
  number: true,
  title: true,
  title_ar: true,
  image: true,
  sort_order: true,
} satisfies Prisma.menu_categoriesSelect;

const ITEM_SELECT = {
  id: true,
  name: true,
  name_ar: true,
  description: true,
  description_ar: true,
  redirect_uber_eats: true,
  redirect_deliveroo: true,
  redirect_just_eat: true,
  price: true,
  image: true,
  badge: true,
  badge_variant: true,
  sort_order: true,
} satisfies Prisma.menu_itemsSelect;

type ItemRow = Prisma.menu_itemsGetPayload<{ select: typeof ITEM_SELECT }>;
type BranchItemRow = ItemRow & {
  branch_menu_items?: { price: Prisma.Decimal | null; sort_order: number | null }[];
};
type CategoryRow = {
  id: string;
  number: string;
  title: string;
  title_ar: string;
  image: string;
  sort_order: number;
  menu_items: BranchItemRow[];
};

/**
 * Keeps every category, even one with no items, so the storefront shows the
 * full category list. An empty category renders as a tab with no products yet.
 */
function toCategories(rows: CategoryRow[]): CategoryWithItems[] {
  return rows.map((cat) => {
    const { menu_items, ...category } = cat;
    // A branch can override sort_order, which lands after the SQL ORDER BY, so
    // re-apply it here. Array.sort is stable, so unchanged keys keep SQL order.
    const items = menu_items
      .map(({ branch_menu_items, ...item }) => {
        const branch = branch_menu_items?.[0];
        return {
          ...item,
          price: branch?.price ?? item.price,
          sort_order: branch?.sort_order ?? item.sort_order,
        };
      })
      .sort((a, b) => a.sort_order - b.sort_order);
    return serialize<CategoryWithItems>({ ...category, items });
  });
}

/**
 * Options for anonymous public reads only.
 *
 * `read`: the call may use the read replica. Safe here because a menu render is
 * lag-tolerant (a just-changed item can take a few seconds to appear), and the
 * order path re-prices everything on the primary regardless.
 * `cache`: the short-lived anonymous cache may serve the response. Admin and
 * personalised reads pass neither, so they always hit the primary, uncached.
 */
export type PublicReadOptions = { read?: boolean; cache?: boolean };

/**
 * A missing branch id means two different responses: the query-string path
 * (`required`) is a 404, the cookie path falls back to the global catalogue.
 * Those must not share a cache entry, or a stale cookie would hide the 404.
 */
export function catalogueCacheKey(
  kind: "menu:full" | "deals",
  scope?: { locationId: string; required: boolean },
): string {
  if (!scope) return `${kind}:global`;
  return `${kind}:${scope.locationId}:${scope.required ? "strict" : "fallback"}`;
}

export async function getFullMenu(
  scope?: { locationId: string; required: boolean },
  options?: PublicReadOptions,
): Promise<CategoryWithItems[]> {
  // Cache fills always use the primary. A replica read must not be stored for the TTL.
  const load = () => loadFullMenu(scope, options?.cache ? false : options?.read);
  if (options?.cache) {
    return cachedJson(catalogueCacheKey("menu:full", scope), TTL_MENU_SECONDS, load);
  }
  return load();
}

async function loadFullMenu(scope?: { locationId: string; required: boolean }, read?: boolean): Promise<CategoryWithItems[]> {
  if (!scope) return globalMenu(read);

  // One lookup, not two: this used to read the location here and then read it
  // again inside resolveBranch on every single request.
  const location = await findActiveLocation(scope.locationId, read);
  if (location && location.status !== "active") return [];
  if (!location) {
    if (scope.required) throw new NotFoundException("Location not found");
    return globalMenu(read);
  }

  const rows = await db(read).menu_categories.findMany({
    orderBy: { sort_order: "asc" },
    select: {
      ...CATEGORY_SELECT,
      menu_items: {
        where: {
          active: true,
          branch_menu_items: { some: { location_id: location.id, available: true } },
        },
        orderBy: { sort_order: "asc" },
        select: {
          ...ITEM_SELECT,
          // (location_id, menu_item_id) is unique, so at most one row can match.
          branch_menu_items: {
            where: { location_id: location.id, available: true },
            select: { price: true, sort_order: true },
            take: 1,
          },
        },
      },
    },
  });

  return toCategories(rows as CategoryRow[]);
}

async function globalMenu(read?: boolean): Promise<CategoryWithItems[]> {
  const rows = await db(read).menu_categories.findMany({
    orderBy: { sort_order: "asc" },
    select: {
      ...CATEGORY_SELECT,
      // Filtered in SQL rather than filtering every row in JS afterwards.
      menu_items: {
        where: { active: true },
        orderBy: { sort_order: "asc" },
        select: ITEM_SELECT,
      },
    },
  });

  return toCategories(rows as CategoryRow[]);
}

/**
 * Every category, including ones with no items. The admin list needs these so
 * a freshly created category does not vanish, and `items` is included because
 * the admin maps it to an item count. Unlike `getFullMenu`, nothing is pruned.
 */
export async function getCategories(options?: PublicReadOptions): Promise<MenuCategory[]> {
  const load = () => loadCategories(options?.cache ? false : options?.read);
  if (options?.cache) return cachedJson("menu:categories", TTL_MENU_SECONDS, load);
  return load();
}

async function loadCategories(read?: boolean): Promise<MenuCategory[]> {
  const rows = await db(read).menu_categories.findMany({
    orderBy: [{ sort_order: "asc" }, { id: "asc" }],
    // Bounded reference data (a menu tree), capped rather than paginated.
    take: 500,
    select: {
      ...CATEGORY_SELECT,
      menu_items: { select: { id: true } },
    },
  });
  return serialize(rows.map(({ menu_items, ...category }) => ({
    ...category,
    items: menu_items.map((item) => ({ id: item.id })),
  }))) as MenuCategory[];
}

export async function getCategoryById(id: string): Promise<MenuCategory> {
  const row = await db().menu_categories.findUnique({ where: { id } });
  if (!row) throw new NotFoundException("Category not found");
  return serialize(row);
}

export async function createCategory(input: Record<string, unknown>): Promise<MenuCategory> {
  try {
    const row = await db().menu_categories.create({
      data: { id: crypto.randomUUID(), ...input } as Prisma.menu_categoriesUncheckedCreateInput,
    });
    void invalidateCatalogueCache();
    return serialize(row);
  } catch (error) {
    rethrow(error, "Category not found");
  }
}

export async function updateCategory(id: string, input: Record<string, unknown>): Promise<MenuCategory> {
  try {
    const row = await db().menu_categories.update({
      where: { id },
      data: input as Prisma.menu_categoriesUncheckedUpdateInput,
    });
    void invalidateCatalogueCache();
    return serialize(row);
  } catch (error) {
    rethrow(error, "Category not found");
  }
}

/**
 * True when a catalogue row still points at this image URL.
 *
 * Images are shared: the seed reuses one demo picture across every category,
 * and the same photo can legitimately be used by two dishes. Destroying on the
 * first delete would strip every other row of its picture, so the URL is only
 * removed once nothing references it. Call this after the row is gone.
 */
async function isImageStillReferenced(url: string): Promise<boolean> {
  const [items, categories, deals] = await Promise.all([
    db().menu_items.count({ where: { image: url } }),
    db().menu_categories.count({ where: { image: url } }),
    db().deals.count({ where: { image: url } }),
  ]);
  return items + categories + deals > 0;
}

/** Removes an image only once no catalogue row points at it any more. */
async function cleanupImage(url: string | undefined): Promise<void> {
  if (!url) return;
  if (await isImageStillReferenced(url)) return;
  await destroyCloudinaryAsset(url);
}

export async function deleteCategory(id: string): Promise<void> {
  try {
    // Read the images first, then delete. The items cascade with the category,
    // so their images leak too and have to be collected before the row goes.
    const current = await db().menu_categories.findUnique({
      where: { id },
      select: { image: true, menu_items: { select: { image: true } } },
    });
    await db().menu_categories.delete({ where: { id } });
    void invalidateCatalogueCache();

    const candidates = new Set<string>();
    if (current?.image) candidates.add(current.image);
    for (const item of current?.menu_items ?? []) {
      if (item.image) candidates.add(item.image);
    }
    for (const url of candidates) await cleanupImage(url);
  } catch (error) {
    rethrow(error, "Category not found");
  }
}

const itemBranchInclude = {
  branch_menu_items: {
    where: { available: true },
    select: { location: { select: { id: true, name: true } } },
    orderBy: { location: { name: "asc" as const } },
  },
};

function withBranches<T extends { branch_menu_items?: { location: { id: string; name: string } }[] }>(row: T) {
  const { branch_menu_items, ...item } = row;
  return {
    ...item,
    locations: (branch_menu_items ?? []).map((link) => link.location),
  };
}

/**
 * `withBranches` is the admin projection. The storefront has no use for which
 * branches stock an item, so it asks for the rows without it.
 *
 * Written as two explicit queries rather than a conditional `include`: the two
 * result shapes are genuinely different types, and spreading the flag into one
 * query object loses that distinction.
 */
export async function getMenuItems(
  categoryId?: string,
  activeOnly = true,
  options?: { limit?: number; includeBranches?: boolean } & PublicReadOptions,
): Promise<MenuItem[]> {
  const load = () => loadMenuItems(categoryId, activeOnly, options?.cache ? { ...options, read: false } : options);
  if (options?.cache && options.includeBranches === false) {
    // The public projection omits branch availability. Never share that entry
    // with an admin-shaped list.
    return cachedJson(
      `menu:items:${categoryId ?? "all"}:${activeOnly ? "active" : "all"}:plain`,
      TTL_MENU_SECONDS,
      load,
    );
  }
  return load();
}

async function loadMenuItems(
  categoryId?: string,
  activeOnly = true,
  options?: { limit?: number; includeBranches?: boolean } & PublicReadOptions,
): Promise<MenuItem[]> {
  const where = {
    ...(activeOnly ? { active: true } : {}),
    ...(categoryId ? { category_id: categoryId } : {}),
  };
  // Bounded catalogue data, so this is capped rather than paginated.
  const take = options?.limit ?? 1000;

  if (options?.includeBranches === false) {
    const rows = await db(options?.read).menu_items.findMany({
      where,
      orderBy: [{ sort_order: "asc" }, { id: "asc" }],
      take,
    });
    return serialize(rows);
  }

  // The items, their branch links and the branch names are independent reads,
  // so they run in one wave. The old `include` chained them: items, then links,
  // then the location names, three waits in a row.
  const client = db(options?.read);
  const [rows, links, locations] = await Promise.all([
    client.menu_items.findMany({ where, orderBy: [{ sort_order: "asc" }, { id: "asc" }], take }),
    client.branch_menu_items.findMany({
      where: { available: true, menu_item: { is: where } },
      select: { menu_item_id: true, location_id: true },
    }),
    client.locations.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } }),
  ]);

  // Same shape and order as the old include: each item lists its available
  // branches, sorted by branch name (the database sorted the names).
  const linkedBy = new Map<string, Set<string>>();
  for (const link of links) {
    const set = linkedBy.get(link.menu_item_id) ?? new Set<string>();
    set.add(link.location_id);
    linkedBy.set(link.menu_item_id, set);
  }
  return serialize(
    rows.map((row) => {
      const linked = linkedBy.get(row.id);
      const branches = locations
        .filter((location) => linked?.has(location.id))
        .map((location) => ({ id: location.id, name: location.name }));
      return { ...row, locations: branches };
    }),
  );
}

export async function getMenuItemById(id: string): Promise<MenuItem> {
  const row = await db().menu_items.findUnique({ where: { id }, include: itemBranchInclude });
  if (!row) throw new NotFoundException("Menu item not found");
  return serialize(withBranches(row));
}

export async function createMenuItem(input: Record<string, unknown>): Promise<MenuItem> {
  try {
    const row = await db().menu_items.create({
      data: { id: crypto.randomUUID(), ...input } as Prisma.menu_itemsUncheckedCreateInput,
    });
    void invalidateCatalogueCache();
    return serialize(row);
  } catch (error) {
    rethrow(error, "Menu item not found");
  }
}

export async function updateMenuItem(id: string, input: Record<string, unknown>): Promise<MenuItem> {
  try {
    const row = await db().menu_items.update({
      where: { id },
      data: input as Prisma.menu_itemsUncheckedUpdateInput,
    });
    void invalidateCatalogueCache();
    return serialize(row);
  } catch (error) {
    rethrow(error, "Menu item not found");
  }
}

export async function deleteMenuItem(id: string): Promise<void> {
  try {
    const current = await db().menu_items.findUnique({ where: { id }, select: { image: true } });
    await db().menu_items.delete({ where: { id } });
    void invalidateCatalogueCache();
    await cleanupImage(current?.image);
  } catch (error) {
    rethrow(error, "Menu item not found");
  }
}

export async function getDealById(id: string): Promise<Deal> {
  const row = await db().deals.findUnique({ where: { id } });
  if (!row) throw new NotFoundException("Deal not found");
  return serialize(row);
}

export async function getDeals(
  activeOnly = true,
  scope?: { locationId: string; required: boolean },
  options?: { limit?: number } & PublicReadOptions,
): Promise<Deal[]> {
  const load = () => loadDeals(activeOnly, scope, options?.cache ? { ...options, read: false } : options);
  if (activeOnly && options?.cache) {
    return cachedJson(catalogueCacheKey("deals", scope), TTL_MENU_SECONDS, load);
  }
  return load();
}

async function loadDeals(
  activeOnly = true,
  scope?: { locationId: string; required: boolean },
  options?: { limit?: number } & PublicReadOptions,
): Promise<Deal[]> {
  const location = await resolveBranch(scope, options?.read);
  if (!location) {
    const rows = await db(options?.read).deals.findMany({
      where: activeOnly ? { active: true } : undefined,
      orderBy: [{ created_at: "desc" }, { id: "desc" }],
      take: options?.limit ?? 500,
    });
    return serialize(rows);
  }

  const rows = await db(options?.read).branch_deals.findMany({
    where: { location_id: location.id, available: true, ...(activeOnly ? { deal: { active: true } } : {}) },
    include: { deal: true },
    orderBy: { id: "asc" },
    take: options?.limit ?? 500,
  });
  return rows.map((row) => serialize<Deal>({ ...row.deal, price: row.price ?? row.deal.price }));
}

export async function createDeal(input: Record<string, unknown>): Promise<Deal> {
  try {
    const row = await db().deals.create({
      data: { id: crypto.randomUUID(), ...input } as Prisma.dealsUncheckedCreateInput,
    });
    void invalidateCatalogueCache();
    return serialize(row);
  } catch (error) {
    rethrow(error, "Deal not found");
  }
}

export async function updateDeal(id: string, input: Record<string, unknown>): Promise<Deal> {
  try {
    const row = await db().deals.update({
      where: { id },
      data: input as Prisma.dealsUncheckedUpdateInput,
    });
    void invalidateCatalogueCache();
    return serialize(row);
  } catch (error) {
    rethrow(error, "Deal not found");
  }
}

export async function deleteDeal(id: string): Promise<void> {
  try {
    const current = await db().deals.findUnique({ where: { id }, select: { image: true } });
    await db().deals.delete({ where: { id } });
    void invalidateCatalogueCache();
    await cleanupImage(current?.image);
  } catch (error) {
    rethrow(error, "Deal not found");
  }
}
