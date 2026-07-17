import { Router } from "express";
import { validate } from "../../middleware/validate.js";
import { businessSettingsSchema } from "../../validators/admin.schema.js";
import { asyncHandler } from "../../utils/async-handler.js";
import { SettingsController } from "../../controllers/admin/settings.controller.js";

const router = Router();

router.get("/", asyncHandler(SettingsController.get));
router.put("/", validate(businessSettingsSchema), asyncHandler(SettingsController.update));

export default router;
