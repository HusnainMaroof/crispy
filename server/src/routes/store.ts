import { Router } from "express";
import { asyncHandler } from "../utils/async-handler.js";
import { validate } from "../middleware/validate.js";
import { setLocationSchema } from "../validators/order.schema.js";
import { StoreController } from "../controllers/store/store.controller.js";
import { StoreJobsController } from "../controllers/store/store-jobs.controller.js";
import { LocationResolutionController } from "../controllers/store/location-resolution.controller.js";
import { locationRouteSchema, resolveLocationSchema } from "../validators/location.schema.js";

const router = Router();

router.get("/locations", asyncHandler(StoreController.locations));
router.get("/locations/:id", asyncHandler(StoreController.locationById));
router.post("/locations/resolve", validate(resolveLocationSchema), asyncHandler(LocationResolutionController.resolve));
router.post("/locations/route", validate(locationRouteSchema), asyncHandler(LocationResolutionController.route));
router.get("/location", asyncHandler(StoreController.myLocation));
router.patch("/location", validate(setLocationSchema), asyncHandler(StoreController.setLocation));
router.get("/settings", asyncHandler(StoreController.settings));
router.get("/homepage", asyncHandler(StoreController.content));
router.get("/cms/:page", asyncHandler(StoreController.content));

router.get("/jobs", asyncHandler(StoreJobsController.list));
router.get("/jobs/:id", asyncHandler(StoreJobsController.getById));

export default router;
