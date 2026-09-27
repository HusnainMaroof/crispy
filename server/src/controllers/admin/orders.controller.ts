import type { Request, Response } from "express";
import { getOrders, getOrderById, nextStatuses, updateOrderStatus, assertOrderAccess } from "../../services/order.service.js";
import { getAccessibleLocationIds } from "../../services/branch-access.service.js";
import { ForbiddenException, UnauthorizedException } from "../../utils/app-error.js";
import { sendSuccess } from "../../utils/response.js";

function withAllowed<T extends { fulfilment: string; status: string }>(order: T) {
  return { ...order, allowed_statuses: nextStatuses(order.fulfilment, order.status) };
}

export const OrdersController = {
  async list(req: Request, res: Response) {
    const status = req.query.status as string | undefined;
    const location_id = req.query.location_id as string | undefined;
    const allowed = await getAccessibleLocationIds(req.admin!);
    if (allowed && location_id && !allowed.includes(location_id)) {
      throw new ForbiddenException("You do not have access to this branch");
    }
    const orders = await getOrders({
      status,
      location_id: location_id ?? undefined,
      location_ids: allowed ?? undefined,
    });
    sendSuccess(res, orders.map((order) => withAllowed(order)));
  },

  async getById(req: Request, res: Response) {
    const result = await getOrderById(req.params.id as string);
    await assertOrderAccess(req.admin!, result.order.location_id);
    sendSuccess(res, { ...result, order: withAllowed(result.order) });
  },

  async updateStatus(req: Request, res: Response) {
    if (!req.admin) throw new UnauthorizedException();
    const order = await updateOrderStatus(req.params.id as string, req.body.status, req.admin);
    sendSuccess(res, withAllowed(order));
  },
};
