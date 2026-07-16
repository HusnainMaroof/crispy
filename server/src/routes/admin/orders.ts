import { Router } from "express";
import { getOrders, getOrderById, updateOrderStatus } from "../../services/order.service.js";
import { validate } from "../../middleware/validate.js";
import { updateOrderStatusSchema } from "../../validators/order.schema.js";
import { sendSuccess, sendError } from "../../utils/response.js";

const router = Router();

router.get("/", async (req, res) => {
  try {
    const status = req.query.status as string | undefined;
    const orders = await getOrders({ status });
    sendSuccess(res, orders);
  } catch (e) {
    sendError(res, e instanceof Error ? e.message : "Unknown error");
  }
});

router.get("/:id", async (req, res) => {
  try {
    const result = await getOrderById(req.params.id as string);
    sendSuccess(res, result);
  } catch (e) {
    sendError(res, e instanceof Error ? e.message : "Unknown error", 404);
  }
});

router.patch("/:id/status", validate(updateOrderStatusSchema), async (req, res) => {
  try {
    const order = await updateOrderStatus(req.params.id as string, req.body.status);
    sendSuccess(res, order);
  } catch (e) {
    sendError(res, e instanceof Error ? e.message : "Unknown error", 400);
  }
});

export default router;
