import type { Request, Response } from "express";
import { getLocations, createLocation, updateLocation, deleteLocation } from "../../services/admin.service.js";
import { sendSuccess } from "../../utils/response.js";

export const LocationsController = {
  async list(_req: Request, res: Response) {
    const locations = await getLocations();
    sendSuccess(res, locations);
  },

  async create(req: Request, res: Response) {
    const location = await createLocation(req.body);
    sendSuccess(res, location);
  },

  async update(req: Request, res: Response) {
    const location = await updateLocation(req.params.id as string, req.body);
    sendSuccess(res, location);
  },

  async remove(req: Request, res: Response) {
    await deleteLocation(req.params.id as string);
    sendSuccess(res, { deleted: true });
  },
};
