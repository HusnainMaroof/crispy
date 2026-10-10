import { Router } from "express";
import { validate } from "../../middleware/validate.js";
import { requireRole } from "../../middleware/auth.js";
import { updateOrderStatusSchema } from "../../validators/order.schema.js";
import { asyncHandler } from "../../utils/async-handler.js";
import { OrdersController } from "../../controllers/admin/orders.controller.js";

const router = Router();

router.get("/", asyncHandler(OrdersController.list));
router.get("/:id", asyncHandler(OrdersController.getById));
router.patch("/:id/status", validate(updateOrderStatusSchema), asyncHandler(OrdersController.updateStatus));
// Erasing an order is terminal and leaves no record, so unlike a status change
// it is restricted to super admins rather than every role that can see orders.
router.delete("/:id", requireRole("superadmin"), asyncHandler(OrdersController.remove));

export default router;
