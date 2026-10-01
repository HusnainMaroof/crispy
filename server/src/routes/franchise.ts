import { Router } from "express";
import { validate } from "../middleware/validate.js";
import { brochureRequestSchema } from "../validators/admin.schema.js";
import { asyncHandler } from "../utils/async-handler.js";
import { FranchiseController } from "../controllers/store/franchise.controller.js";

const router = Router();

router.post("/brochure", validate(brochureRequestSchema), asyncHandler(FranchiseController.requestBrochure));

export default router;
