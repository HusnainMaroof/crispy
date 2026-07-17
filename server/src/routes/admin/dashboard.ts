import { Router } from "express";
import { asyncHandler } from "../../utils/async-handler.js";
import { DashboardController } from "../../controllers/admin/dashboard.controller.js";

const router = Router();

router.get("/stats", asyncHandler(DashboardController.stats));

export default router;
