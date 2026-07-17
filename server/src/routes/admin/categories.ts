import { Router } from "express";
import { validate } from "../../middleware/validate.js";
import { menuCategorySchema, menuCategoryUpdateSchema } from "../../validators/menu.schema.js";
import { asyncHandler } from "../../utils/async-handler.js";
import { CategoriesController } from "../../controllers/admin/categories.controller.js";

const router = Router();

router.get("/", asyncHandler(CategoriesController.list));
router.get("/:id", asyncHandler(CategoriesController.getById));
router.post("/", validate(menuCategorySchema), asyncHandler(CategoriesController.create));
router.put("/:id", validate(menuCategoryUpdateSchema), asyncHandler(CategoriesController.update));
router.delete("/:id", asyncHandler(CategoriesController.remove));

export default router;
