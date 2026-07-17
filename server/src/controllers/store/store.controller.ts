import type { Request, Response } from "express";
import { getLocations, getLocationById, getSettings } from "../../services/store.service.js";
import { sendSuccess, sendError } from "../../utils/response.js";

const COOKIE_OPTIONS = {
  maxAge: 90 * 24 * 60 * 60 * 1000,
  secure: true,
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
    const { location_id } = req.body;
    if (!location_id) {
      sendError(res, "location_id is required", 400);
      return;
    }

    const location = await getLocationById(location_id as string);
    res.cookie("crispy_location_id", location.id, COOKIE_OPTIONS);
    sendSuccess(res, location);
  },

  async settings(_req: Request, res: Response) {
    const settings = await getSettings();
    sendSuccess(res, settings);
  },
};
