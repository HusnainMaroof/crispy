import type { Request, Response } from "express";
import { createOrder } from "../../services/order.service.js";
import { createContactMessage, createJobApplication } from "../../services/admin.service.js";
import { sendSuccess } from "../../utils/response.js";

export const ActionsController = {
  async createOrder(req: Request, res: Response) {
    const order = await createOrder(req.body);
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
};
