import type { Request, Response } from "express";
import { getCustomerForStaff, getOwnProfile, listCustomers, updateOwnProfile } from "../../services/customer.service.js";
import { UnauthorizedException } from "../../utils/app-error.js";
import { resolvePage, sendPaged } from "../../utils/pagination.js";
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
    const page = resolvePage(req.query as { page?: unknown; limit?: unknown });
    const { customers, total } = await listCustomers(req.admin, { q, ...page });
    sendPaged(res, customers, total, page);
  },

  async getById(req: Request, res: Response) {
    if (!req.admin) throw new UnauthorizedException();
    sendSuccess(res, await getCustomerForStaff(req.admin, req.params.id as string));
  },
};
