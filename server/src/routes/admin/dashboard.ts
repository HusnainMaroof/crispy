import { Router } from "express";
import { getDashboardStats } from "../../services/order.service.js";
import { sendSuccess, sendError } from "../../utils/response.js";

const router = Router();

router.get("/stats", async (_req, res) => {
  try {
    const stats = await getDashboardStats();
    sendSuccess(res, stats);
  } catch (e) {
    sendError(res, e instanceof Error ? e.message : "Unknown error");
  }
});

export default router;
