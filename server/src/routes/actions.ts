import { Router } from "express";
import { validate } from "../middleware/validate.js";
import { createOrderSchema, customerProfileSchema, orderLookupSchema } from "../validators/order.schema.js";
import { contactMessageSchema, jobApplicationPublicSchema } from "../validators/admin.schema.js";
import { asyncHandler } from "../utils/async-handler.js";
import { ActionsController } from "../controllers/store/actions.controller.js";
import { CustomerController } from "../controllers/store/customers.controller.js";

const router = Router();

router.post("/orders", validate(createOrderSchema), asyncHandler(ActionsController.createOrder));
router.get("/orders/mine", asyncHandler(ActionsController.myOrders));
router.post("/orders/lookup", validate(orderLookupSchema), asyncHandler(ActionsController.lookupOrder));
router.get("/orders/:id", asyncHandler(ActionsController.getOrder));
router.get("/customers/me", asyncHandler(CustomerController.me));
router.patch("/customers/me", validate(customerProfileSchema), asyncHandler(CustomerController.updateMe));
router.post("/contact", validate(contactMessageSchema), asyncHandler(ActionsController.contact));
router.post("/jobs/:id/apply", validate(jobApplicationPublicSchema), asyncHandler(ActionsController.applyForJob));

export default router;
