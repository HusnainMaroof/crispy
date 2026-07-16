import { Router } from "express";
import { createOrder } from "../services/order.service.js";
import { createContactMessage } from "../services/admin.service.js";
import { validate } from "../middleware/validate.js";
import { createOrderSchema } from "../validators/order.schema.js";
import { contactMessageSchema } from "../validators/admin.schema.js";
import { sendSuccess, sendError } from "../utils/response.js";

const router = Router();

router.post("/orders", validate(createOrderSchema), async (req, res) => {
  try {
    const order = await createOrder(req.body);
    sendSuccess(res, order, 201);
  } catch (e) {
    sendError(res, e instanceof Error ? e.message : "Unknown error", 400);
  }
});

router.post("/contact", validate(contactMessageSchema), async (req, res) => {
  try {
    const message = await createContactMessage(req.body);
    sendSuccess(res, message, 201);
  } catch (e) {
    sendError(res, e instanceof Error ? e.message : "Unknown error", 400);
  }
});

export default router;
