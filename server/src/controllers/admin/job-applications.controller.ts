import type { Request, Response } from "express";
import {
  getJobApplications,
  getJobApplicationById,
  createJobApplication,
  updateJobApplication,
  deleteJobApplication,
} from "../../services/admin.service.js";
import { sendSuccess } from "../../utils/response.js";

export const JobApplicationsController = {
  async list(req: Request, res: Response) {
    const { job_post_id, status } = req.query;
    const applications = await getJobApplications({
      job_post_id: job_post_id as string | undefined,
      status: status as string | undefined,
    });
    sendSuccess(res, applications);
  },

  async getById(req: Request, res: Response) {
    const app = await getJobApplicationById(req.params.id as string);
    sendSuccess(res, app);
  },

  async create(req: Request, res: Response) {
    const app = await createJobApplication(req.body);
    sendSuccess(res, app, 201);
  },

  async update(req: Request, res: Response) {
    const app = await updateJobApplication(req.params.id as string, req.body);
    sendSuccess(res, app);
  },

  async updateStatus(req: Request, res: Response) {
    const { status } = req.body;
    const updated = await updateJobApplication(req.params.id as string, { status });
    sendSuccess(res, updated);
  },

  async remove(req: Request, res: Response) {
    await deleteJobApplication(req.params.id as string);
    sendSuccess(res, { deleted: true });
  },
};
