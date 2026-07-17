import type { Request, Response } from "express";
import { getDeals, getDealById, createDeal, updateDeal, deleteDeal } from "../../services/menu.service.js";
import { sendSuccess } from "../../utils/response.js";

export const DealsController = {
  async list(_req: Request, res: Response) {
    const deals = await getDeals(false);
    sendSuccess(res, deals);
  },

  async create(req: Request, res: Response) {
    const deal = await createDeal(req.body);
    sendSuccess(res, deal, 201);
  },

  async update(req: Request, res: Response) {
    const deal = await updateDeal(req.params.id as string, req.body);
    sendSuccess(res, deal);
  },

  async toggle(req: Request, res: Response) {
    const target = await getDealById(req.params.id as string);
    const updated = await updateDeal(req.params.id as string, { active: !target.active });
    sendSuccess(res, updated);
  },

  async remove(req: Request, res: Response) {
    await deleteDeal(req.params.id as string);
    sendSuccess(res, { deleted: true });
  },
};
