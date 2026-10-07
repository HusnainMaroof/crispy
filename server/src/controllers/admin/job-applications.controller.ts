import type { Request, Response } from "express";
import {
  getJobApplications,
  countJobApplications,
  createJobApplication,
  updateJobApplication,
  deleteJobApplication,
  assertJobPostAccess,
  assertJobApplicationAccess,
} from "../../services/admin.service.js";
import { getAccessibleLocationIds } from "../../services/branch-access.service.js";
import { NotFoundException } from "../../utils/app-error.js";
import { resolvePage, sendPaged } from "../../utils/pagination.js";
import { sendSuccess } from "../../utils/response.js";

export const JobApplicationsController = {
  /**
   * Applications are scoped through the branch of the post they belong to, so a
   * branch manager only ever sees candidates who applied to their own branch.
   */
  async list(req: Request, res: Response) {
    const { job_post_id, status } = req.query;
    const q = req.query.q as string | undefined;
    const page = resolvePage(req.query as { page?: unknown; limit?: unknown });
    const allowed = await getAccessibleLocationIds(req.admin!);
    const filter = {
      job_post_id: job_post_id as string | undefined,
      status: status as string | undefined,
      q,
      location_ids: allowed ?? undefined,
    };
    const [applications, total] = await Promise.all([
      getJobApplications({ ...filter, ...page }),
      countJobApplications(filter),
    ]);
    sendPaged(res, applications, total, page);
  },

  async getById(req: Request, res: Response) {
    const app = await assertJobApplicationAccess(req.admin!, req.params.id as string);
    sendSuccess(res, app);
  },

  async create(req: Request, res: Response) {
    // A manual entry has to name a post the caller can actually manage,
    // otherwise the application would land outside their branch scope.
    const jobId = typeof req.body.job_post_id === "string" ? req.body.job_post_id : "";
    if (!jobId) throw new NotFoundException("Job post not found");
    await assertJobPostAccess(req.admin!, jobId);

    const app = await createJobApplication(req.body);
    sendSuccess(res, app, 201);
  },

  async update(req: Request, res: Response) {
    await assertJobApplicationAccess(req.admin!, req.params.id as string);
    const app = await updateJobApplication(req.params.id as string, req.body);
    sendSuccess(res, app);
  },

  async updateStatus(req: Request, res: Response) {
    await assertJobApplicationAccess(req.admin!, req.params.id as string);
    const { status } = req.body;
    const updated = await updateJobApplication(req.params.id as string, { status });
    sendSuccess(res, updated);
  },

  async remove(req: Request, res: Response) {
    await assertJobApplicationAccess(req.admin!, req.params.id as string);
    await deleteJobApplication(req.params.id as string);
    sendSuccess(res, { deleted: true });
  },
};
