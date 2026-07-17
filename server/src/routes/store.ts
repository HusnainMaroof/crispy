import { Router } from "express";
import { asyncHandler } from "../utils/async-handler.js";
import { StoreController } from "../controllers/store/store.controller.js";

const router = Router();

router.get("/locations", asyncHandler(StoreController.locations));
router.get("/locations/:id", asyncHandler(StoreController.locationById));
router.get("/location", asyncHandler(StoreController.myLocation));
router.patch("/location", asyncHandler(StoreController.setLocation));
router.get("/settings", asyncHandler(StoreController.settings));

export default router;
