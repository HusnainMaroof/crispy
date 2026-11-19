import type { Request, Response } from "express";
import { requestBrochure, submitApplication } from "../../services/franchise.service.js";
import { checkVerificationCode, sendVerificationCode } from "../../services/email-verification.service.js";
import { sendSuccess } from "../../utils/response.js";

export const FranchiseController = {
  async sendCode(req: Request, res: Response) {
    const result = await sendVerificationCode(req.body);
    sendSuccess(res, result, 201);
  },

  async checkCode(req: Request, res: Response) {
    const result = await checkVerificationCode(req.body);
    sendSuccess(res, result);
  },

  async requestBrochure(req: Request, res: Response) {
    const result = await requestBrochure(req.body);
    sendSuccess(res, result);
  },

  async submitApplication(req: Request, res: Response) {
    const result = await submitApplication(req.body);
    sendSuccess(res, result, 201);
  },
};
