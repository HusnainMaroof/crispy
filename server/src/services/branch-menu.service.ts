import { Prisma } from "../generated/prisma/client.js";
import { getPrisma } from "../config/prisma.js";
import { NotFoundException } from "../utils/app-error.js";
import { rethrow, serialize } from "../utils/db.js";

function db() {
  return getPrisma();
}

async function requireLocation(locationId: string) {
  const location = await db().locations.findUnique({ where: { id: locationId }, select: { id: true } });
  if (!location) throw new NotFoundException("Location not found");
}

export async function setItemBranches(menuItemId: string, locationIds: string[]) {
  const unique = [...new Set(locationIds)];
  if (unique.length > 0) {
    const found = await db().locations.findMany({ where: { id: { in: unique } }, select: { id: true } });
    if (found.length !== unique.length) throw new NotFoundException("Location not found");
  }

  await db().$transaction([
    db().branch_menu_items.deleteMany({
      where: {
        menu_item_id: menuItemId,
        ...(unique.length > 0 ? { location_id: { notIn: unique } } : {}),
      },
    }),
    ...unique.map((locationId) =>
      db().branch_menu_items.upsert({
        where: { location_id_menu_item_id: { location_id: locationId, menu_item_id: menuItemId } },
        create: {
          location_id: locationId,
          menu_item_id: menuItemId,
          available: true,
          price: null,
        },
        update: { available: true },
      }),
    ),
  ]);
}

export async function getBranchMenu(locationId: string) {
  await requireLocation(locationId);
  const rows = await db().branch_menu_items.findMany({
    where: { location_id: locationId },
    include: { menu_item: { select: { id: true, name: true, price: true, active: true } } },
    orderBy: [{ sort_order: "asc" }, { id: "asc" }],
  });

  return rows.map((row) =>
    serialize({
      id: row.id,
      location_id: row.location_id,
      menu_item_id: row.menu_item_id,
      name: row.menu_item.name,
      price: row.price,
      inherited_price: row.menu_item.price,
      effective_price: row.price ?? row.menu_item.price,
      available: row.available,
      sort_order: row.sort_order,
      catalogue_active: row.menu_item.active,
    }),
  );
}

export async function upsertBranchMenuItems(
  locationId: string,
  items: { menu_item_id: string; price?: number | null; available?: boolean; sort_order?: number | null }[],
  options?: { replace?: boolean },
) {
  await requireLocation(locationId);
  try {
    if (options?.replace) {
      await db().branch_menu_items.deleteMany({
        where: {
          location_id: locationId,
          ...(items.length > 0 ? { menu_item_id: { notIn: items.map((item) => item.menu_item_id) } } : {}),
        },
      });
    }
    if (items.length === 0) return [];
    const saved = await db().$transaction(
      items.map((item) =>
        db().branch_menu_items.upsert({
          where: { location_id_menu_item_id: { location_id: locationId, menu_item_id: item.menu_item_id } },
          create: {
            location_id: locationId,
            menu_item_id: item.menu_item_id,
            price: item.price ?? null,
            available: item.available ?? true,
            sort_order: item.sort_order ?? null,
          },
          update: {
            ...(item.price !== undefined ? { price: item.price } : {}),
            ...(item.available !== undefined ? { available: item.available } : {}),
            ...(item.sort_order !== undefined ? { sort_order: item.sort_order } : {}),
          },
        }),
      ),
    );
    return serialize(saved);
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2003") {
      throw new NotFoundException("Menu item not found");
    }
    rethrow(error, "Location not found");
  }
}

export async function getBranchDeals(locationId: string) {
  await requireLocation(locationId);
  const rows = await db().branch_deals.findMany({
    where: { location_id: locationId },
    include: { deal: { select: { id: true, name: true, price: true, active: true } } },
    orderBy: { id: "asc" },
  });

  return rows.map((row) =>
    serialize({
      id: row.id,
      location_id: row.location_id,
      deal_id: row.deal_id,
      name: row.deal.name,
      price: row.price,
      inherited_price: row.deal.price,
      effective_price: row.price ?? row.deal.price,
      available: row.available,
      catalogue_active: row.deal.active,
    }),
  );
}

export async function upsertBranchDeals(
  locationId: string,
  deals: { deal_id: string; price?: number | null; available?: boolean }[],
) {
  await requireLocation(locationId);
  try {
    const saved = await db().$transaction(
      deals.map((deal) =>
        db().branch_deals.upsert({
          where: { location_id_deal_id: { location_id: locationId, deal_id: deal.deal_id } },
          create: {
            location_id: locationId,
            deal_id: deal.deal_id,
            price: deal.price ?? null,
            available: deal.available ?? true,
          },
          update: {
            ...(deal.price !== undefined ? { price: deal.price } : {}),
            ...(deal.available !== undefined ? { available: deal.available } : {}),
          },
        }),
      ),
    );
    return serialize(saved);
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2003") {
      throw new NotFoundException("Deal not found");
    }
    rethrow(error, "Location not found");
  }
}
