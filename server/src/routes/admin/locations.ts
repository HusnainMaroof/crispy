import { Router } from "express";
import { requireTab, requireRole } from "../../middleware/auth.js";
import { validate } from "../../middleware/validate.js";
import { locationSchema, locationUpdateSchema, branchMenuWriteSchema, branchDealWriteSchema } from "../../validators/order.schema.js";
import { asyncHandler } from "../../utils/async-handler.js";
import { LocationsController } from "../../controllers/admin/locations.controller.js";

const router = Router();

router.get("/", asyncHandler(LocationsController.list));
router.get("/:id/menu", asyncHandler(LocationsController.menu));
router.put("/:id/menu", requireRole("superadmin", "branch_manager"), requireTab("menu", "branch-menu"), validate(branchMenuWriteSchema), asyncHandler(LocationsController.saveMenu));
router.get("/:id/deals", asyncHandler(LocationsController.deals));
router.put("/:id/deals", requireRole("superadmin", "branch_manager"), requireTab("menu", "branch-menu"), validate(branchDealWriteSchema), asyncHandler(LocationsController.saveDeals));
router.get("/:id", asyncHandler(LocationsController.getById));
router.post("/", requireRole("superadmin"), requireTab("locations", "branches"), validate(locationSchema), asyncHandler(LocationsController.create));
router.patch("/:id", requireRole("superadmin"), requireTab("locations", "branches"), validate(locationUpdateSchema), asyncHandler(LocationsController.update));
router.delete("/:id", requireRole("superadmin"), requireTab("locations", "branches"), asyncHandler(LocationsController.remove));

export default router;
