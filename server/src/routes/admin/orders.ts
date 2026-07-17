import { Router } from "express";
import { validate } from "../../middleware/validate.js";
import { updateOrderStatusSchema } from "../../validators/order.schema.js";
import { asyncHandler } from "../../utils/async-handler.js";
import { OrdersController } from "../../controllers/admin/orders.controller.js";

const router = Router();

router.get("/", asyncHandler(OrdersController.list));
router.get("/:id", asyncHandler(OrdersController.getById));
router.patch("/:id/status", validate(updateOrderStatusSchema), asyncHandler(OrdersController.updateStatus));

export default router;
