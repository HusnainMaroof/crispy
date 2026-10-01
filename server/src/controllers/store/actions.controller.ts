import type { Request, Response } from "express";
import { createOrder, getOrdersByCustomerId, getOrdersByEmail, getOrderById, customerCanView } from "../../services/order.service.js";
import { NotFoundException } from "../../utils/app-error.js";
import { resolvePage, sendPaged } from "../../utils/pagination.js";
import { createContactMessage, createJobApplication } from "../../services/admin.service.js";
import { sendSuccess } from "../../utils/response.js";

export const ActionsController = {
  async createOrder(req: Request, res: Response) {
    const order = await createOrder({ ...req.body, customer_id: req.customerId });
    sendSuccess(res, order, 201);
  },

  async contact(req: Request, res: Response) {
    const message = await createContactMessage(req.body);
    sendSuccess(res, message, 201);
  },

  async applyForJob(req: Request, res: Response) {
    // Same rule as the public job page: draft and closed posts are not found.
    const application = await createJobApplication(
      { ...req.body, job_post_id: req.params.id },
      { activeOnly: true },
    );
    sendSuccess(res, application, 201);
  },

  async myOrders(req: Request, res: Response) {
    const page = resolvePage(req.query as { page?: unknown; limit?: unknown });
    const { orders, total } = await getOrdersByCustomerId(req.customerId, page);
    sendPaged(res, orders, total, page);
  },

  async lookupOrder(req: Request, res: Response) {
    const { email } = req.body;
    const page = resolvePage(req.query as { page?: unknown; limit?: unknown });
    // The ownership check is a second where clause now, not a JavaScript
    // filter over whatever the email happened to match.
    const { orders, total } = await getOrdersByEmail(email, req.customerId, page);
    sendPaged(res, orders, total, page);
  },

  async getOrder(req: Request, res: Response) {
    const result = await getOrderById(req.params.id as string);
    if (!customerCanView(result.order.customer_id, req.customerId)) {
      throw new NotFoundException("Order not found");
    }
    sendSuccess(res, result);
  },
};
