import type { Request, Response } from "express";
import {
  getMenuItems,
  getMenuItemById,
  createMenuItem,
  updateMenuItem,
  deleteMenuItem,
} from "../../services/menu.service.js";
import { sendSuccess } from "../../utils/response.js";

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
    const item = await createMenuItem(req.body);
    sendSuccess(res, item, 201);
  },

  async update(req: Request, res: Response) {
    const item = await updateMenuItem(req.params.id as string, req.body);
    sendSuccess(res, item);
  },

  async remove(req: Request, res: Response) {
    await deleteMenuItem(req.params.id as string);
    sendSuccess(res, { deleted: true });
  },
};
