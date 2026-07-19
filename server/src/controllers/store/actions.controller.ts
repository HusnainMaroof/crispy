import type { Request, Response } from "express";
import { createOrder, getOrdersByCustomerId, getOrdersByEmail, getOrderById } from "../../services/order.service.js";
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
    const application = await createJobApplication({ ...req.body, job_post_id: req.params.id });
    sendSuccess(res, application, 201);
  },

  async myOrders(req: Request, res: Response) {
    const orders = await getOrdersByCustomerId(req.customerId);
    sendSuccess(res, orders);
  },

  async lookupOrder(req: Request, res: Response) {
    const { email } = req.body;
    const orders = await getOrdersByEmail(email);
    sendSuccess(res, orders);
  },

  async getOrder(req: Request, res: Response) {
    const result = await getOrderById(req.params.id as string);
    sendSuccess(res, result);
  },
};
