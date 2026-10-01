import type { Request, Response } from "express";
import { requestBrochure } from "../../services/franchise.service.js";
import { sendSuccess } from "../../utils/response.js";

export const FranchiseController = {
  async requestBrochure(req: Request, res: Response) {
    const result = await requestBrochure(req.body);
    sendSuccess(res, result, 201);
  },
};
