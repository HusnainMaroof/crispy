import { Router } from "express";
import {
  getCategories,
  getCategoryById,
  createCategory,
  updateCategory,
  deleteCategory,
} from "../../services/menu.service.js";
import { validate } from "../../middleware/validate.js";
import { menuCategorySchema, menuCategoryUpdateSchema } from "../../validators/menu.schema.js";
import { sendSuccess, sendError } from "../../utils/response.js";

const router = Router();

router.get("/", async (_req, res) => {
  try {
    const categories = await getCategories();
    sendSuccess(res, categories);
  } catch (e) {
    sendError(res, e instanceof Error ? e.message : "Unknown error");
  }
});

router.get("/:id", async (req, res) => {
  try {
    const category = await getCategoryById(req.params.id as string);
    sendSuccess(res, category);
  } catch (e) {
    sendError(res, e instanceof Error ? e.message : "Unknown error", 404);
  }
});

router.post("/", validate(menuCategorySchema), async (req, res) => {
  try {
    const category = await createCategory(req.body);
    sendSuccess(res, category, 201);
  } catch (e) {
    sendError(res, e instanceof Error ? e.message : "Unknown error", 400);
  }
});

router.put("/:id", validate(menuCategoryUpdateSchema), async (req, res) => {
  try {
    const category = await updateCategory(req.params.id as string, req.body);
    sendSuccess(res, category);
  } catch (e) {
    sendError(res, e instanceof Error ? e.message : "Unknown error", 400);
  }
});

router.delete("/:id", async (req, res) => {
  try {
    await deleteCategory(req.params.id as string);
    sendSuccess(res, null, 204);
  } catch (e) {
    sendError(res, e instanceof Error ? e.message : "Unknown error", 400);
  }
});

export default router;
