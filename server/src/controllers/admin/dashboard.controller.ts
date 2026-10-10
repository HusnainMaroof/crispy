import type { Request, Response } from "express";
import { getDashboardStats } from "../../services/order.service.js";
import { getAccessibleLocationIds } from "../../services/branch-access.service.js";
import { sendSuccess } from "../../utils/response.js";

export const DashboardController = {
  async stats(req: Request, res: Response) {
    const allowed = await getAccessibleLocationIds(req.admin!);
    // Cached for a few seconds, keyed by this caller's branch scope and dropped
    // on every order write. The dashboard is read repeatedly while a shift is
    // running, and the underlying aggregates scan the whole order history.
    const stats = await getDashboardStats(allowed, { cache: true });
    sendSuccess(res, stats);
  },
};
