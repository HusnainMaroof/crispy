import type { Request, Response } from "express";
import { getDashboardStats } from "../../services/order.service.js";
import { getAccessibleLocationIds } from "../../services/branch-access.service.js";
import { sendSuccess } from "../../utils/response.js";

export const DashboardController = {
  async stats(req: Request, res: Response) {
    const allowed = await getAccessibleLocationIds(req.admin!);
    const stats = await getDashboardStats(allowed);
    sendSuccess(res, stats);
  },
};
