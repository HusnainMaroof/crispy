import type { Request, Response } from "express";
import {
  getFullMenu,
  getCategoryById,
  createCategory,
  updateCategory,
  deleteCategory,
} from "../../services/menu.service.js";
import { sendSuccess } from "../../utils/response.js";

export const CategoriesController = {
  async list(_req: Request, res: Response) {
    const menu = await getFullMenu();
    sendSuccess(res, menu);
  },

  async getById(req: Request, res: Response) {
    const category = await getCategoryById(req.params.id as string);
    sendSuccess(res, category);
  },

  async create(req: Request, res: Response) {
    const category = await createCategory(req.body);
    sendSuccess(res, category, 201);
  },

  async update(req: Request, res: Response) {
    const category = await updateCategory(req.params.id as string, req.body);
    sendSuccess(res, category);
  },

  async remove(req: Request, res: Response) {
    await deleteCategory(req.params.id as string);
    sendSuccess(res, { deleted: true });
  },
};
