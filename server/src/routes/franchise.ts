import { Router } from "express";
import { validate } from "../middleware/validate.js";
import {
  brochureRequestSchema,
  franchiseApplicationSchema,
  verifyCheckSchema,
  verifySendSchema,
} from "../validators/admin.schema.js";
import { asyncHandler } from "../utils/async-handler.js";
import { FranchiseController } from "../controllers/store/franchise.controller.js";

const router = Router();

// Email verification. The brochure and the application both need the token
// that a correct code returns.
router.post("/verify/send", validate(verifySendSchema), asyncHandler(FranchiseController.sendCode));
router.post("/verify/check", validate(verifyCheckSchema), asyncHandler(FranchiseController.checkCode));

router.post("/brochure", validate(brochureRequestSchema), asyncHandler(FranchiseController.requestBrochure));
router.post(
  "/application",
  validate(franchiseApplicationSchema),
  asyncHandler(FranchiseController.submitApplication),
);

export default router;
