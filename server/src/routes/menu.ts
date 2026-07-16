import { Router } from "express";
import { getCategories, getMenuItems, getDeals } from "../services/menu.service.js";
import { sendSuccess, sendError } from "../utils/response.js";

const router = Router();

router.get("/categories", async (_req, res) => {
  try {
    const categories = await getCategories();
    sendSuccess(res, categories);
  } catch (e) {
    sendError(res, e instanceof Error ? e.message : "Unknown error");
  }
});

router.get("/items", async (req, res) => {
  try {
    const categoryId = req.query.category_id as string | undefined;
    const items = await getMenuItems(categoryId);
    sendSuccess(res, items);
  } catch (e) {
    sendError(res, e instanceof Error ? e.message : "Unknown error");
  }
});

router.get("/deals", async (_req, res) => {
  try {
    const deals = await getDeals();
    sendSuccess(res, deals);
  } catch (e) {
    sendError(res, e instanceof Error ? e.message : "Unknown error");
  }
});

export default router;
