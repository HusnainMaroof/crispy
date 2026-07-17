import type { Request, Response } from "express";
import { getCategories, getMenuItems, getDeals, getFullMenu } from "../../services/menu.service.js";
import { sendSuccess } from "../../utils/response.js";

export const MenuController = {
  async full(_req: Request, res: Response) {
    const menu = await getFullMenu();
    sendSuccess(res, menu);
  },

  async categories(_req: Request, res: Response) {
    const categories = await getCategories();
    sendSuccess(res, categories);
  },

  async items(req: Request, res: Response) {
    const categoryId = req.query.category_id as string | undefined;
    const items = await getMenuItems(categoryId);
    sendSuccess(res, items);
  },

  async deals(_req: Request, res: Response) {
    const deals = await getDeals();
    sendSuccess(res, deals);
  },
};
