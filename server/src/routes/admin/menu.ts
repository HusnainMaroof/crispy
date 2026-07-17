import { Router } from "express";
import { validate } from "../../middleware/validate.js";
import { menuItemSchema, menuItemUpdateSchema } from "../../validators/menu.schema.js";
import { asyncHandler } from "../../utils/async-handler.js";
import { MenuItemsController } from "../../controllers/admin/menu-items.controller.js";

const router = Router();

router.get("/", asyncHandler(MenuItemsController.list));
router.get("/:id", asyncHandler(MenuItemsController.getById));
router.post("/", validate(menuItemSchema), asyncHandler(MenuItemsController.create));
router.put("/:id", validate(menuItemUpdateSchema), asyncHandler(MenuItemsController.update));
router.delete("/:id", asyncHandler(MenuItemsController.remove));

export default router;
