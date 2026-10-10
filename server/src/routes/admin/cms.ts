import { Router } from "express";
import { validate } from "../../middleware/validate.js";
import { cmsMoveSchema, cmsResetSchema, cmsSectionUpdateSchema } from "../../validators/cms.schema.js";
import { asyncHandler } from "../../utils/async-handler.js";
import { CmsController } from "../../controllers/admin/cms.controller.js";
import { requireRole } from "../../middleware/auth.js";

const router = Router();

router.get("/pages", asyncHandler(CmsController.pages));
router.get("/pages/:page", asyncHandler(CmsController.page));
// CMS content is site-wide, not per branch, so writes are limited to the super
// admin explicitly. A branch manager's tab list must never reach these routes.
router.patch("/sections/:id", requireRole("superadmin"), validate(cmsSectionUpdateSchema), asyncHandler(CmsController.update));
router.post("/sections/:id/move", requireRole("superadmin"), validate(cmsMoveSchema), asyncHandler(CmsController.move));
router.post("/sections/:id/reset", requireRole("superadmin"), validate(cmsResetSchema), asyncHandler(CmsController.reset));

export default router;
