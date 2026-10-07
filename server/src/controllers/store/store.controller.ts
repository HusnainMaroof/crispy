import type { Request, Response } from "express";
import { getLocations, getLocationById, getSettings } from "../../services/store.service.js";
import { getPublicCmsPage } from "../../services/cms.service.js";
import { resolveLocale } from "../../config/locales.js";
import { NotFoundException } from "../../utils/app-error.js";
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
  // Anonymous public reads: lag-tolerant, so the replica and short cache are
  // allowed. The cookie-based routes below stay on the primary so a branch a
  // visitor just picked is readable immediately.
  async locations(_req: Request, res: Response) {
    const locations = await getLocations({ read: true, cache: true });
    sendSuccess(res, locations);
  },

  async locationById(req: Request, res: Response) {
    const location = await getLocationById(req.params.id as string, { read: true });
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
      if (location.status !== "active") {
        sendSuccess(res, null);
        return;
      }
      sendSuccess(res, location);
    } catch {
      sendSuccess(res, null);
    }
  },

  async setLocation(req: Request, res: Response) {
    const location = await getLocationById(req.body.location_id);
    if (location.status !== "active") throw new NotFoundException("Location not found");
    res.cookie("crispy_location_id", location.id, COOKIE_OPTIONS);
    sendSuccess(res, location);
  },

  async settings(_req: Request, res: Response) {
    const settings = await getSettings({ read: true, cache: true });
    sendSuccess(res, settings);
  },

  async content(req: Request, res: Response) {
    const query = req.query.locale;
    const requested = resolveLocale(typeof query === "string" ? query : req.cookies?.crispy_locale);
    // Cache-Control and Vary: Cookie are set in index.ts for this path and
    // for /api/store/homepage. Setting them again here overwrote the shorter
    // cookie-bound max-age.
    sendSuccess(res, await getPublicCmsPage((req.params.page as string | undefined) ?? "home", requested));
  },
};
