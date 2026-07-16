import { Router } from "express";
import {
  getMenuItems,
  getMenuItemById,
  createMenuItem,
  updateMenuItem,
  deleteMenuItem,
} from "../../services/menu.service.js";
import { validate } from "../../middleware/validate.js";
import { menuItemSchema, menuItemUpdateSchema } from "../../validators/menu.schema.js";
import { sendSuccess, sendError } from "../../utils/response.js";

const router = Router();

router.get("/", async (req, res) => {
  try {
    const categoryId = req.query.category_id as string | undefined;
    const items = await getMenuItems(categoryId);
    sendSuccess(res, items);
  } catch (e) {
    sendError(res, e instanceof Error ? e.message : "Unknown error");
  }
});

router.get("/:id", async (req, res) => {
  try {
    const item = await getMenuItemById(req.params.id as string);
    sendSuccess(res, item);
  } catch (e) {
    sendError(res, e instanceof Error ? e.message : "Unknown error", 404);
  }
});

router.post("/", validate(menuItemSchema), async (req, res) => {
  try {
    const item = await createMenuItem(req.body);
    sendSuccess(res, item, 201);
  } catch (e) {
    sendError(res, e instanceof Error ? e.message : "Unknown error", 400);
  }
});

router.put("/:id", validate(menuItemUpdateSchema), async (req, res) => {
  try {
    const item = await updateMenuItem(req.params.id as string, req.body);
    sendSuccess(res, item);
  } catch (e) {
    sendError(res, e instanceof Error ? e.message : "Unknown error", 400);
  }
});

router.delete("/:id", async (req, res) => {
  try {
    await deleteMenuItem(req.params.id as string);
    sendSuccess(res, null, 204);
  } catch (e) {
    sendError(res, e instanceof Error ? e.message : "Unknown error", 400);
  }
});

export default router;
