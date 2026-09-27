import type { Request, Response } from "express";
import { getCustomerForStaff, getOwnProfile, listCustomers, updateOwnProfile } from "../../services/customer.service.js";
import { UnauthorizedException } from "../../utils/app-error.js";
import { sendSuccess } from "../../utils/response.js";

export const CustomerController = {
  async me(req: Request, res: Response) {
    sendSuccess(res, await getOwnProfile(req.customerId));
  },

  async updateMe(req: Request, res: Response) {
    const profile = await updateOwnProfile(req.customerId, req.body);
    sendSuccess(res, profile);
  },
};

export const AdminCustomersController = {
  async list(req: Request, res: Response) {
    if (!req.admin) throw new UnauthorizedException();
    const q = typeof req.query.q === "string" ? req.query.q : undefined;
    sendSuccess(res, await listCustomers(req.admin, q));
  },

  async getById(req: Request, res: Response) {
    if (!req.admin) throw new UnauthorizedException();
    sendSuccess(res, await getCustomerForStaff(req.admin, req.params.id as string));
  },
};
