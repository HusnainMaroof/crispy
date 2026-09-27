import type { Request, Response } from "express";
import { getLocations, getLocationById, getSettings } from "../../services/store.service.js";
import { getPublicCmsPage } from "../../services/cms.service.js";
import { localeFromAcceptLanguage } from "../../config/locales.js";
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
  async locations(_req: Request, res: Response) {
    const locations = await getLocations({ activeOnly: true });
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
    const settings = await getSettings();
    sendSuccess(res, settings);
  },

  async content(req: Request, res: Response) {
    const requested = req.query.locale ?? req.cookies?.crispy_locale ?? localeFromAcceptLanguage(req.headers["accept-language"]);
    sendSuccess(res, await getPublicCmsPage((req.params.page as string | undefined) ?? "home", requested));
  },
};
