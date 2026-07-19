import { Router } from "express";
import { validate } from "../middleware/validate.js";
import { createOrderSchema } from "../validators/order.schema.js";
import { contactMessageSchema, jobApplicationPublicSchema } from "../validators/admin.schema.js";
import { asyncHandler } from "../utils/async-handler.js";
import { ActionsController } from "../controllers/store/actions.controller.js";

const router = Router();

router.post("/orders", validate(createOrderSchema), asyncHandler(ActionsController.createOrder));
router.post("/contact", validate(contactMessageSchema), asyncHandler(ActionsController.contact));
router.post("/jobs/:id/apply", validate(jobApplicationPublicSchema), asyncHandler(ActionsController.applyForJob));

export default router;
