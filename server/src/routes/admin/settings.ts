import { Router } from "express";
import { getSettings, updateSettings } from "../../services/admin.service.js";
import { validate } from "../../middleware/validate.js";
import { businessSettingsSchema } from "../../validators/admin.schema.js";
import { sendSuccess, sendError } from "../../utils/response.js";

const router = Router();

router.get("/", async (_req, res) => {
  try {
    const settings = await getSettings();
    sendSuccess(res, settings);
  } catch (e) {
    sendError(res, e instanceof Error ? e.message : "Unknown error");
  }
});

router.put("/", validate(businessSettingsSchema), async (req, res) => {
  try {
    const settings = await updateSettings(req.body);
    sendSuccess(res, settings);
  } catch (e) {
    sendError(res, e instanceof Error ? e.message : "Unknown error", 400);
  }
});

export default router;
