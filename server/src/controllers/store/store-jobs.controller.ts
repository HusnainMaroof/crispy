import type { Request, Response } from "express";
import { getJobPosts, getJobPostById } from "../../services/admin.service.js";
import { sendSuccess } from "../../utils/response.js";

export const StoreJobsController = {
  async list(_req: Request, res: Response) {
    const posts = await getJobPosts({ status: "active" });
    sendSuccess(res, posts);
  },

  async getById(req: Request, res: Response) {
    const post = await getJobPostById(req.params.id as string);
    sendSuccess(res, post);
  },
};
