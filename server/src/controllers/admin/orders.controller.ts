import type { Request, Response } from "express";
import { getOrders, countOrders, getOrderById, nextStatuses, updateOrderStatus, deleteOrder, assertOrderAccess } from "../../services/order.service.js";
import { getAccessibleLocationIds } from "../../services/branch-access.service.js";
import { ForbiddenException, UnauthorizedException } from "../../utils/app-error.js";
import { resolvePage, sendPaged } from "../../utils/pagination.js";
import { sendSuccess } from "../../utils/response.js";

function withAllowed<T extends { fulfilment: string; status: string }>(order: T) {
  return { ...order, allowed_statuses: nextStatuses(order.fulfilment, order.status) };
}

export const OrdersController = {
  async list(req: Request, res: Response) {
    const status = req.query.status as string | undefined;
    const location_id = req.query.location_id as string | undefined;
    const fulfilment = req.query.fulfilment as string | undefined;
    const q = req.query.q as string | undefined;
    const page = resolvePage(req.query as { page?: unknown; limit?: unknown });

    const allowed = await getAccessibleLocationIds(req.admin!);
    if (allowed && location_id && !allowed.includes(location_id)) {
      throw new ForbiddenException("You do not have access to this branch");
    }

    const filter = {
      status,
      fulfilment,
      q,
      location_id: location_id ?? undefined,
      location_ids: allowed ?? undefined,
    };

    // Independent reads, so they run concurrently rather than one after the
    // other. They are not in a single snapshot, so an order placed between the
    // two can make the count differ by one from the rows shown; that is the
    // same behaviour the client-side list already had.
    const [orders, total] = await Promise.all([
      getOrders({ ...filter, ...page }),
      countOrders(filter),
    ]);

    sendPaged(res, orders.map((order) => withAllowed(order)), total, page);
  },

  async getById(req: Request, res: Response) {
    const result = await getOrderById(req.params.id as string);
    await assertOrderAccess(req.admin!, result.order.location_id);
    sendSuccess(res, { ...result, order: withAllowed(result.order) });
  },

  async updateStatus(req: Request, res: Response) {
    if (!req.admin) throw new UnauthorizedException();
    await updateOrderStatus(req.params.id as string, req.body.status, req.admin);
    // Re-read through getOrderById rather than returning updateOrderStatus's
    // bare row. The bare row has no location_name and no items, so replacing
    // the client-side row with it turned the Branch column into a raw UUID.
    const result = await getOrderById(req.params.id as string);
    sendSuccess(res, withAllowed({ ...result.order, items: result.items }));
  },

  async remove(req: Request, res: Response) {
    if (!req.admin) throw new UnauthorizedException();
    await deleteOrder(req.params.id as string, req.admin);
    sendSuccess(res, { deleted: true });
  },
};
