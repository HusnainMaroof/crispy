import { Router } from "express";
import { asyncHandler } from "../utils/async-handler.js";
import { validate } from "../middleware/validate.js";
import { setLocationSchema } from "../validators/order.schema.js";
import { StoreController } from "../controllers/store/store.controller.js";

const router = Router();

router.get("/locations", asyncHandler(StoreController.locations));
router.get("/locations/:id", asyncHandler(StoreController.locationById));
router.get("/location", asyncHandler(StoreController.myLocation));
router.patch("/location", validate(setLocationSchema), asyncHandler(StoreController.setLocation));
router.get("/settings", asyncHandler(StoreController.settings));

export default router;
