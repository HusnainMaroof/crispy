import { Router } from "express";
import { validate } from "../../middleware/validate.js";
import { loginSchema } from "../../validators/admin.schema.js";
import { authenticate } from "../../middleware/auth.js";
import { asyncHandler } from "../../utils/async-handler.js";
import { AuthController } from "../../controllers/admin/auth.controller.js";

const router = Router();

router.post("/login", validate(loginSchema), asyncHandler(AuthController.login));
router.get("/me", authenticate, asyncHandler(AuthController.me));

export default router;
