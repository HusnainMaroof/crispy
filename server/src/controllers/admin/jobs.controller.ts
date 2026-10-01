import type { Request, Response } from "express";
import {
  getJobPosts,
  countJobPosts,
  getJobPostById,
  createJobPost,
  updateJobPost,
  deleteJobPost,
} from "../../services/admin.service.js";
import { sendSuccess } from "../../utils/response.js";
import { resolvePage, sendPaged } from "../../utils/pagination.js";

export const JobsController = {
  async list(req: Request, res: Response) {
    const status = req.query.status as string | undefined;
    const q = req.query.q as string | undefined;
    const page = resolvePage(req.query as { page?: unknown; limit?: unknown });
    const filter = { status, q };
    const [posts, total] = await Promise.all([
      getJobPosts({ ...filter, ...page }),
      countJobPosts(filter),
    ]);
    sendPaged(res, posts, total, page);
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
