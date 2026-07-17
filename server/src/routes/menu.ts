import { Router } from "express";
import { asyncHandler } from "../utils/async-handler.js";
import { validate } from "../middleware/validate.js";
import { menuItemsQuerySchema } from "../validators/menu.schema.js";
import { MenuController } from "../controllers/store/menu.controller.js";

const router = Router();

router.get("/full", asyncHandler(MenuController.full));
router.get("/categories", asyncHandler(MenuController.categories));
router.get("/items", validate(menuItemsQuerySchema, "query"), asyncHandler(MenuController.items));
router.get("/deals", asyncHandler(MenuController.deals));

export default router;
