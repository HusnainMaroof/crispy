import type { Request, Response } from "express";
import {
  getMenuItems,
  getMenuItemById,
  createMenuItem,
  updateMenuItem,
  deleteMenuItem,
} from "../../services/menu.service.js";
import { setItemBranches } from "../../services/branch-menu.service.js";
import { ForbiddenException } from "../../utils/app-error.js";
import { isBranchScoped } from "../../config/admin-roles.js";
import { sendSuccess } from "../../utils/response.js";

function assertCatalogueEditor(role: string | undefined) {
  if (role && isBranchScoped(role)) {
    throw new ForbiddenException("This account can change its branch menu, not the shared catalogue");
  }
}

function catalogueBody(body: Record<string, unknown>) {
  const { location_ids: locationIds, ...item } = body;
  return {
    item,
    locationIds: Array.isArray(locationIds) ? locationIds.filter((id): id is string => typeof id === "string") : undefined,
  };
}

export const MenuItemsController = {
  async list(req: Request, res: Response) {
    const categoryId = req.query.category_id as string | undefined;
    const items = categoryId ? await getMenuItems(categoryId, false) : await getMenuItems(undefined, false);
    sendSuccess(res, items);
  },

  async getById(req: Request, res: Response) {
    const item = await getMenuItemById(req.params.id as string);
    sendSuccess(res, item);
  },

  async create(req: Request, res: Response) {
    assertCatalogueEditor(req.admin?.role);
    const { item, locationIds } = catalogueBody(req.body);
    const created = await createMenuItem(item);
    if (locationIds) await setItemBranches(created.id, locationIds);
    sendSuccess(res, await getMenuItemById(created.id), 201);
  },

  async update(req: Request, res: Response) {
    assertCatalogueEditor(req.admin?.role);
    const { item, locationIds } = catalogueBody(req.body);
    const id = req.params.id as string;
    await updateMenuItem(id, item);
    if (locationIds) await setItemBranches(id, locationIds);
    sendSuccess(res, await getMenuItemById(id));
  },

  async remove(req: Request, res: Response) {
    assertCatalogueEditor(req.admin?.role);
    await deleteMenuItem(req.params.id as string);
    sendSuccess(res, { deleted: true });
  },
};
