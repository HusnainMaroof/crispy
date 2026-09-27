import { Router } from "express";
import { validate } from "../../middleware/validate.js";
import { customerSearchSchema } from "../../validators/order.schema.js";
import { asyncHandler } from "../../utils/async-handler.js";
import { AdminCustomersController } from "../../controllers/store/customers.controller.js";

const router = Router();

router.get("/", validate(customerSearchSchema, "query"), asyncHandler(AdminCustomersController.list));
router.get("/:id", asyncHandler(AdminCustomersController.getById));

export default router;
