import type { Request, Response } from "express";
import { getLocations, createLocation, updateLocation } from "../../services/admin.service.js";
import { getLocationById } from "../../services/store.service.js";
import { assertLocationAccess, getAccessibleLocationIds } from "../../services/branch-access.service.js";
import { countStaffByLocation } from "../../services/staff.service.js";
import { ForbiddenException } from "../../utils/app-error.js";
import { getBranchMenu, upsertBranchMenuItems, getBranchDeals, upsertBranchDeals } from "../../services/branch-menu.service.js";
import { sendSuccess } from "../../utils/response.js";

function assertBranchAdmin(role: string | undefined) {
  if (role === "branch_manager") throw new ForbiddenException("Branch managers cannot manage branches");
}

export const LocationsController = {
  async list(req: Request, res: Response) {
    const allowed = await getAccessibleLocationIds(req.admin!);
    const locations = await getLocations();
    const counts = await countStaffByLocation();
    const visible = allowed ? locations.filter((location) => allowed.includes(location.id)) : locations;
    sendSuccess(res, visible.map((location) => ({ ...location, staff_count: counts.get(location.id) ?? 0 })));
  },

  async getById(req: Request, res: Response) {
    const locationId = req.params.id as string;
    await assertLocationAccess(req.admin!, locationId);
    const location = await getLocationById(locationId);
    sendSuccess(res, location);
  },

  async create(req: Request, res: Response) {
    assertBranchAdmin(req.admin?.role);
    const location = await createLocation(req.body);
    sendSuccess(res, location);
  },

  async update(req: Request, res: Response) {
    assertBranchAdmin(req.admin?.role);
    const locationId = req.params.id as string;
    const location = await updateLocation(locationId, req.body);
    sendSuccess(res, location);
  },

  async remove(req: Request, res: Response) {
    assertBranchAdmin(req.admin?.role);
    const locationId = req.params.id as string;
    const location = await updateLocation(locationId, { status: "inactive" });
    sendSuccess(res, location);
  },

  async menu(req: Request, res: Response) {
    const locationId = req.params.id as string;
    await assertLocationAccess(req.admin!, locationId);
    sendSuccess(res, await getBranchMenu(locationId));
  },

  async saveMenu(req: Request, res: Response) {
    const locationId = req.params.id as string;
    await assertLocationAccess(req.admin!, locationId);
    sendSuccess(res, await upsertBranchMenuItems(locationId, req.body.items));
  },

  async deals(req: Request, res: Response) {
    const locationId = req.params.id as string;
    await assertLocationAccess(req.admin!, locationId);
    sendSuccess(res, await getBranchDeals(locationId));
  },

  async saveDeals(req: Request, res: Response) {
    const locationId = req.params.id as string;
    await assertLocationAccess(req.admin!, locationId);
    sendSuccess(res, await upsertBranchDeals(locationId, req.body.deals));
  },
};
