import { Prisma } from "../generated/prisma/client.js";
import { getPrisma } from "../config/prisma.js";
import { NotFoundException } from "../utils/app-error.js";
import { rethrow, serialize } from "../utils/db.js";
import type { MenuCategory, MenuItem, Deal } from "../types/models.js";

export interface CategoryWithItems extends MenuCategory {
  items: MenuItem[];
}

function db() {
  return getPrisma();
}

/** Only the two columns the menu needs to decide scope — not the whole row. */
async function findActiveLocation(locationId: string) {
  return db().locations.findUnique({
    where: { id: locationId },
    select: { id: true, status: true },
  });
}

async function resolveBranch(scope?: { locationId: string; required: boolean }) {
  if (!scope) return null;
  const location = await findActiveLocation(scope.locationId);
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
 * Drops categories with nothing in them. The branch path already did this; the
 * global path did not, so an empty or placeholder category still rendered as a
 * dead tab that opened onto an empty grid.
 */
function toCategories(rows: CategoryRow[]): CategoryWithItems[] {
  return rows.flatMap((cat) => {
    const { menu_items, ...category } = cat;
    if (menu_items.length === 0) return [];
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
    return [serialize<CategoryWithItems>({ ...category, items })];
  });
}

export async function getFullMenu(scope?: { locationId: string; required: boolean }): Promise<CategoryWithItems[]> {
  if (!scope) return globalMenu();

  // One lookup, not two: this used to read the location here and then read it
  // again inside resolveBranch on every single request.
  const location = await findActiveLocation(scope.locationId);
  if (location && location.status !== "active") return [];
  if (!location) {
    if (scope.required) throw new NotFoundException("Location not found");
    return globalMenu();
  }

  const rows = await db().menu_categories.findMany({
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

async function globalMenu(): Promise<CategoryWithItems[]> {
  const rows = await db().menu_categories.findMany({
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
export async function getCategories(): Promise<MenuCategory[]> {
  const rows = await db().menu_categories.findMany({
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
    return serialize(row);
  } catch (error) {
    rethrow(error, "Category not found");
  }
}

export async function deleteCategory(id: string): Promise<void> {
  try {
    await db().menu_categories.delete({ where: { id } });
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
  options?: { limit?: number; includeBranches?: boolean },
): Promise<MenuItem[]> {
  const where = {
    ...(activeOnly ? { active: true } : {}),
    ...(categoryId ? { category_id: categoryId } : {}),
  };
  // Bounded catalogue data, so this is capped rather than paginated.
  const take = options?.limit ?? 1000;

  if (options?.includeBranches === false) {
    const rows = await db().menu_items.findMany({
      where,
      orderBy: [{ sort_order: "asc" }, { id: "asc" }],
      take,
    });
    return serialize(rows);
  }

  const rows = await db().menu_items.findMany({
    where,
    orderBy: [{ sort_order: "asc" }, { id: "asc" }],
    take,
    include: itemBranchInclude,
  });
  return serialize(rows.map(withBranches));
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
    return serialize(row);
  } catch (error) {
    rethrow(error, "Menu item not found");
  }
}

export async function deleteMenuItem(id: string): Promise<void> {
  try {
    await db().menu_items.delete({ where: { id } });
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
  options?: { limit?: number },
): Promise<Deal[]> {
  const location = await resolveBranch(scope);
  if (!location) {
    const rows = await db().deals.findMany({
      where: activeOnly ? { active: true } : undefined,
      orderBy: [{ created_at: "desc" }, { id: "desc" }],
      take: options?.limit ?? 500,
    });
    return serialize(rows);
  }

  const rows = await db().branch_deals.findMany({
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
    return serialize(row);
  } catch (error) {
    rethrow(error, "Deal not found");
  }
}

export async function deleteDeal(id: string): Promise<void> {
  try {
    await db().deals.delete({ where: { id } });
  } catch (error) {
    rethrow(error, "Deal not found");
  }
}
