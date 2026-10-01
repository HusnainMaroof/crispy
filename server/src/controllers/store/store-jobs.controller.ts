import type { Request, Response } from "express";
import { getJobPosts, getJobPostById } from "../../services/admin.service.js";
import { NotFoundException } from "../../utils/app-error.js";
import { sendSuccess } from "../../utils/response.js";

export const StoreJobsController = {
  async list(_req: Request, res: Response) {
    const posts = await getJobPosts({ status: "active" });
    sendSuccess(res, posts);
  },

  async getById(req: Request, res: Response) {
    const post = await getJobPostById(req.params.id as string);
    // This route is anonymous, so a draft or closed post used to be readable by
    // anyone who guessed the id. The list already hides them; the detail now
    // agrees with it.
    if (post.status !== "active") throw new NotFoundException("Job post not found");
    sendSuccess(res, post);
  },
};
