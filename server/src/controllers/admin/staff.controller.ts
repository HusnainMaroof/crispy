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
import { sendSuccess } from "../../utils/response.js";

function actor(req: Request) {
  if (!req.admin) throw new UnauthorizedException();
  return req.admin;
}

export const StaffController = {
  async list(req: Request, res: Response) {
    sendSuccess(res, await listStaff(actor(req)));
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
