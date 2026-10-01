import type { Request, Response } from "express";
import {
  createStaff,
  getStaff,
  listStaff,
  replaceStaffBranches,
  setStaffActive,
  updateStaff,
} from "../../services/staff.service.js";
import { UnauthorizedException } from "../../utils/app-error.js";
import { resolvePage, sendPaged } from "../../utils/pagination.js";
import { sendSuccess } from "../../utils/response.js";

function actor(req: Request) {
  if (!req.admin) throw new UnauthorizedException();
  return req.admin;
}

export const StaffController = {
  async list(req: Request, res: Response) {
    const page = resolvePage(req.query as { page?: unknown; limit?: unknown });
    const { staff, total } = await listStaff(actor(req), {
      q: typeof req.query.q === "string" ? req.query.q : undefined,
      role: typeof req.query.role === "string" ? req.query.role : undefined,
      branch_id: typeof req.query.branch_id === "string" ? req.query.branch_id : undefined,
      is_active: req.query.is_active === undefined ? undefined : req.query.is_active === "true",
      ...page,
    });
    sendPaged(res, staff, total, page);
  },

  async getById(req: Request, res: Response) {
    sendSuccess(res, await getStaff(actor(req), req.params.id as string));
  },

  async create(req: Request, res: Response) {
    const staff = await createStaff(actor(req), req.body);
    sendSuccess(res, staff, 201);
  },

  async update(req: Request, res: Response) {
    sendSuccess(res, await updateStaff(actor(req), req.params.id as string, req.body));
  },

  async deactivate(req: Request, res: Response) {
    sendSuccess(res, await setStaffActive(actor(req), req.params.id as string, false));
  },

  async activate(req: Request, res: Response) {
    sendSuccess(res, await setStaffActive(actor(req), req.params.id as string, true));
  },

  async branches(req: Request, res: Response) {
    sendSuccess(res, await replaceStaffBranches(actor(req), req.params.id as string, req.body.branchIds));
  },
};
