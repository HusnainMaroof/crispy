import type { Request, Response } from "express";
import { resolveLocation } from "../../services/location-resolution.service.js";
import { getLocationRoute } from "../../services/location-route.service.js";
import { sendSuccess } from "../../utils/response.js";

export const LocationResolutionController = {
  async resolve(req: Request, res: Response) {
    const result = await resolveLocation(req.body);
    sendSuccess(res, result);
  },

  async route(req: Request, res: Response) {
    const result = await getLocationRoute(req.body);
    sendSuccess(res, result);
  },
};
