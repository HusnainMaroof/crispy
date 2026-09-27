import { Router } from "express";
import { validate } from "../../middleware/validate.js";
import { cmsMoveSchema, cmsResetSchema, cmsSectionUpdateSchema } from "../../validators/cms.schema.js";
import { asyncHandler } from "../../utils/async-handler.js";
import { CmsController } from "../../controllers/admin/cms.controller.js";

const router = Router();

router.get("/pages", asyncHandler(CmsController.pages));
router.get("/pages/:page", asyncHandler(CmsController.page));
router.patch("/sections/:id", validate(cmsSectionUpdateSchema), asyncHandler(CmsController.update));
router.post("/sections/:id/move", validate(cmsMoveSchema), asyncHandler(CmsController.move));
router.post("/sections/:id/reset", validate(cmsResetSchema), asyncHandler(CmsController.reset));

export default router;
