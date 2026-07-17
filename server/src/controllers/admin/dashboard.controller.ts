import type { Request, Response } from "express";
import { getDashboardStats } from "../../services/order.service.js";
import { sendSuccess } from "../../utils/response.js";

export const DashboardController = {
  async stats(_req: Request, res: Response) {
    const stats = await getDashboardStats();
    sendSuccess(res, stats);
  },
};
