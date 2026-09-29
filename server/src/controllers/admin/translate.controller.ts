import type { Request, Response } from "express";
import { sendSuccess } from "../../utils/response.js";
import { translateToArabic } from "../../services/translate.service.js";

export const TranslateController = {
  async translate(req: Request, res: Response) {
    const { text } = req.body as { text: string };
    const translated = await translateToArabic(text);
    sendSuccess(res, { translated });
  },
};
