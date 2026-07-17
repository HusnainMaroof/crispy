import type { Request, Response } from "express";
import {
  getJobPosts,
  getJobPostById,
  createJobPost,
  updateJobPost,
  deleteJobPost,
} from "../../services/admin.service.js";
import { sendSuccess } from "../../utils/response.js";

export const JobsController = {
  async list(req: Request, res: Response) {
    const status = req.query.status as string | undefined;
    const posts = await getJobPosts(status ? { status } : undefined);
    sendSuccess(res, posts);
  },

  async getById(req: Request, res: Response) {
    const post = await getJobPostById(req.params.id as string);
    sendSuccess(res, post);
  },

  async create(req: Request, res: Response) {
    const post = await createJobPost(req.body);
    sendSuccess(res, post, 201);
  },

  async update(req: Request, res: Response) {
    const post = await updateJobPost(req.params.id as string, req.body);
    sendSuccess(res, post);
  },

  async updateStatus(req: Request, res: Response) {
    const { status } = req.body;
    const updated = await updateJobPost(req.params.id as string, { status });
    sendSuccess(res, updated);
  },

  async remove(req: Request, res: Response) {
    await deleteJobPost(req.params.id as string);
    sendSuccess(res, { deleted: true });
  },
};
