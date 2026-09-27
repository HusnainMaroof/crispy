import type { Request, Response } from "express";
import {
  getCmsPageForEditing,
  listCmsPages,
  moveCmsSection,
  resetCmsSection,
  updateCmsSection,
} from "../../services/cms.service.js";
import { UnauthorizedException } from "../../utils/app-error.js";
import { sendSuccess } from "../../utils/response.js";

function actor(req: Request) {
  if (!req.admin) throw new UnauthorizedException();
  return req.admin;
}

export const CmsController = {
  async pages(req: Request, res: Response) {
    sendSuccess(res, await listCmsPages(actor(req)));
  },

  async page(req: Request, res: Response) {
    const locale = typeof req.query.locale === "string" ? req.query.locale : undefined;
    sendSuccess(res, await getCmsPageForEditing(actor(req), req.params.page as string, locale));
  },

  async update(req: Request, res: Response) {
    sendSuccess(res, await updateCmsSection(actor(req), req.params.id as string, req.body));
  },

  async move(req: Request, res: Response) {
    sendSuccess(res, await moveCmsSection(actor(req), req.params.id as string, req.body.direction));
  },

  async reset(req: Request, res: Response) {
    sendSuccess(res, await resetCmsSection(actor(req), req.params.id as string, req.body.locale));
  },
};
