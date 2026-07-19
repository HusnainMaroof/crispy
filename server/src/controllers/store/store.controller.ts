import type { Request, Response } from "express";
import { getLocations, getLocationById, getSettings, getHomepageContent } from "../../services/store.service.js";
import { sendSuccess } from "../../utils/response.js";
import { envConfig } from "../../config/env.js";

const COOKIE_OPTIONS = {
  httpOnly: true,
  maxAge: 90 * 24 * 60 * 60 * 1000,
  secure: envConfig.SERVER.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
};

export const StoreController = {
  async locations(_req: Request, res: Response) {
    const locations = await getLocations();
    sendSuccess(res, locations);
  },

  async locationById(req: Request, res: Response) {
    const location = await getLocationById(req.params.id as string);
    sendSuccess(res, location);
  },

  async myLocation(req: Request, res: Response) {
    const id = req.cookies?.crispy_location_id;
    if (!id) {
      sendSuccess(res, null);
      return;
    }
    try {
      const location = await getLocationById(id);
      sendSuccess(res, location);
    } catch {
      sendSuccess(res, null);
    }
  },

  async setLocation(req: Request, res: Response) {
    const location = await getLocationById(req.body.location_id);
    res.cookie("crispy_location_id", location.id, COOKIE_OPTIONS);
    sendSuccess(res, location);
  },

  async settings(_req: Request, res: Response) {
    const settings = await getSettings();
    sendSuccess(res, settings);
  },

  async homepage(_req: Request, res: Response) {
    const content = await getHomepageContent();
    sendSuccess(res, content);
  },
};
