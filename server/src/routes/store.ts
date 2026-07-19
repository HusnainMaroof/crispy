import { Router } from "express";
import { asyncHandler } from "../utils/async-handler.js";
import { validate } from "../middleware/validate.js";
import { setLocationSchema } from "../validators/order.schema.js";
import { StoreController } from "../controllers/store/store.controller.js";
import { StoreJobsController } from "../controllers/store/store-jobs.controller.js";

const router = Router();

router.get("/locations", asyncHandler(StoreController.locations));
router.get("/locations/:id", asyncHandler(StoreController.locationById));
router.get("/location", asyncHandler(StoreController.myLocation));
router.patch("/location", validate(setLocationSchema), asyncHandler(StoreController.setLocation));
router.get("/settings", asyncHandler(StoreController.settings));
router.get("/homepage", asyncHandler(StoreController.homepage));

router.get("/jobs", asyncHandler(StoreJobsController.list));
router.get("/jobs/:id", asyncHandler(StoreJobsController.getById));

export default router;
