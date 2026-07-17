import type { Request, Response } from "express";
import { getOrders, getOrderById, updateOrderStatus } from "../../services/order.service.js";
import { sendSuccess } from "../../utils/response.js";

export const OrdersController = {
  async list(req: Request, res: Response) {
    const status = req.query.status as string | undefined;
    const location_id = req.query.location_id as string | undefined;
    const orders = await getOrders({ status, location_id });
    sendSuccess(res, orders);
  },

  async getById(req: Request, res: Response) {
    const result = await getOrderById(req.params.id as string);
    sendSuccess(res, result);
  },

  async updateStatus(req: Request, res: Response) {
    const order = await updateOrderStatus(req.params.id as string, req.body.status);
    sendSuccess(res, order);
  },
};
