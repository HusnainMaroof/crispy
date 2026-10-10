import { Router } from "express";
import { validate } from "../middleware/validate.js";
import { translateSchema } from "../validators/translate.schema.js";
import { asyncHandler } from "../utils/async-handler.js";
import { TranslateController } from "../controllers/admin/translate.controller.js";
import { translateLimiter } from "../middleware/rate-limiter.js";

const router = Router();

router.post("/translate", translateLimiter, validate(translateSchema), asyncHandler(TranslateController.translate));

export default router;
