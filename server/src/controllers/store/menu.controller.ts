import type { Request, Response } from "express";
import { getCategories, getMenuItems, getDeals, getFullMenu } from "../../services/menu.service.js";
import { quoteCart } from "../../services/quote.service.js";
import { sendSuccess } from "../../utils/response.js";

export const MenuController = {
  async full(req: Request, res: Response) {
    const queryId = req.query.location_id;
    const cookieId = req.cookies?.crispy_location_id;
    const menu = typeof queryId === "string" && queryId
      ? await getFullMenu({ locationId: queryId, required: true })
      : typeof cookieId === "string" && cookieId
        ? await getFullMenu({ locationId: cookieId, required: false })
        : await getFullMenu();
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

  async quote(req: Request, res: Response) {
    const quote = await quoteCart(req.body.locationId, req.body.items, req.body.locale);
    sendSuccess(res, quote);
  },

  async deals(req: Request, res: Response) {
    const queryId = req.query.location_id;
    const cookieId = req.cookies?.crispy_location_id;
    const deals = typeof queryId === "string" && queryId
      ? await getDeals(true, { locationId: queryId, required: true })
      : typeof cookieId === "string" && cookieId
        ? await getDeals(true, { locationId: cookieId, required: false })
        : await getDeals();
    sendSuccess(res, deals);
  },
};
