import { Router } from "express";
import { validate } from "../../middleware/validate.js";
import { dealSchema, dealUpdateSchema } from "../../validators/menu.schema.js";
import { asyncHandler } from "../../utils/async-handler.js";
import { DealsController } from "../../controllers/admin/deals.controller.js";

const router = Router();

router.get("/", asyncHandler(DealsController.list));
router.get("/:id", asyncHandler(DealsController.getById));
router.post("/", validate(dealSchema), asyncHandler(DealsController.create));
router.put("/:id", validate(dealUpdateSchema), asyncHandler(DealsController.update));
router.patch("/:id/toggle", asyncHandler(DealsController.toggle));
router.delete("/:id", asyncHandler(DealsController.remove));

export default router;
