import type { Request, Response } from "express";
import { getSettings, updateSettings } from "../../services/admin.service.js";
import { sendSuccess } from "../../utils/response.js";

export const SettingsController = {
  async get(_req: Request, res: Response) {
    const settings = await getSettings();
    sendSuccess(res, settings);
  },

  async update(req: Request, res: Response) {
    const settings = await updateSettings(req.body);
    sendSuccess(res, settings);
  },
};
