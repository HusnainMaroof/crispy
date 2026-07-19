import { Router } from "express";
import { validate } from "../../middleware/validate.js";
import { locationSchema, locationUpdateSchema } from "../../validators/order.schema.js";
import { asyncHandler } from "../../utils/async-handler.js";
import { LocationsController } from "../../controllers/admin/locations.controller.js";

const router = Router();

router.get("/", asyncHandler(LocationsController.list));
router.get("/:id", asyncHandler(LocationsController.getById));
router.post("/", validate(locationSchema), asyncHandler(LocationsController.create));
router.patch("/:id", validate(locationUpdateSchema), asyncHandler(LocationsController.update));
router.delete("/:id", asyncHandler(LocationsController.remove));

export default router;
