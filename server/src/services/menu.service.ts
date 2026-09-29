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

async function resolveBranch(scope?: { locationId: string; required: boolean }) {
  if (!scope) return null;
  const location = await db().locations.findUnique({ where: { id: scope.locationId } });
  if (!location || location.status !== "active") {
    if (scope.required) throw new NotFoundException("Location not found");
    return null;
  }
  return location;
}

export async function getFullMenu(scope?: { locationId: string; required: boolean }): Promise<CategoryWithItems[]> {
  if (!scope) return globalMenu();

  const stored = await db().locations.findUnique({ where: { id: scope.locationId }, select: { status: true } });
  if (stored && stored.status !== "active") return [];

  const location = await resolveBranch(scope);
  if (!location) return globalMenu();

  const rows = await db().menu_categories.findMany({
    orderBy: { sort_order: "asc" },
    include: {
      menu_items: {
        where: {
          active: true,
          branch_menu_items: { some: { location_id: location.id, available: true } },
        },
        orderBy: { sort_order: "asc" },
        include: {
          branch_menu_items: {
            where: { location_id: location.id },
            select: { price: true, sort_order: true },
          },
        },
      },
    },
  });

  return rows.flatMap((cat) => {
    const { menu_items, ...category } = cat;
    const items = menu_items.map((item) => {
      const branch = item.branch_menu_items[0];
      const { branch_menu_items: _branchRows, ...product } = item;
      return {
        ...product,
        price: branch?.price ?? product.price,
        sort_order: branch?.sort_order ?? product.sort_order,
      };
    });
    if (items.length === 0) return [];
    return [serialize<CategoryWithItems>({ ...category, items })];
  });
}

async function globalMenu(): Promise<CategoryWithItems[]> {
  const rows = await db().menu_categories.findMany({
    orderBy: { sort_order: "asc" },
    include: { menu_items: { orderBy: { sort_order: "asc" } } },
  });

  return rows.map((cat) => {
    const { menu_items, ...category } = cat;
    return serialize({
      ...category,
      items: menu_items.filter((item) => item.active),
    });
  });
}

export async function getCategories(): Promise<MenuCategory[]> {
  const rows = await db().menu_categories.findMany({ orderBy: { sort_order: "asc" } });
  return serialize(rows);
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

export async function getMenuItems(categoryId?: string, activeOnly = true): Promise<MenuItem[]> {
  const rows = await db().menu_items.findMany({
    where: {
      ...(activeOnly ? { active: true } : {}),
      ...(categoryId ? { category_id: categoryId } : {}),
    },
    orderBy: { sort_order: "asc" },
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

export async function getDeals(activeOnly = true, scope?: { locationId: string; required: boolean }): Promise<Deal[]> {
  const location = await resolveBranch(scope);
  if (!location) {
    const rows = await db().deals.findMany({
      where: activeOnly ? { active: true } : undefined,
      orderBy: { created_at: "desc" },
    });
    return serialize(rows);
  }

  const rows = await db().branch_deals.findMany({
    where: { location_id: location.id, available: true, ...(activeOnly ? { deal: { active: true } } : {}) },
    include: { deal: true },
    orderBy: { id: "asc" },
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
