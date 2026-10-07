import type { Request, Response } from "express";
import {
  getJobPosts,
  countJobPosts,
  getJobPostTypes,
  getLocations,
  createJobPost,
  updateJobPost,
  deleteJobPost,
  assertJobPostAccess,
  resolveJobPostLocation,
} from "../../services/admin.service.js";
import {
  getAccessibleLocationIds,
  assertLocationAccess,
} from "../../services/branch-access.service.js";
import { BadRequestException } from "../../utils/app-error.js";
import { sendSuccess } from "../../utils/response.js";
import { resolvePage, sendPaged } from "../../utils/pagination.js";

export const JobsController = {
  async list(req: Request, res: Response) {
    const status = req.query.status as string | undefined;
    const q = req.query.q as string | undefined;
    const locationId = req.query.location_id as string | undefined;
    const page = resolvePage(req.query as { page?: unknown; limit?: unknown });

    // `null` means super admin, i.e. every branch. Otherwise it is the allow-list
    // and is ANDed with the requested branch in jobPostWhere.
    const allowed = await getAccessibleLocationIds(req.admin!);
    if (allowed && locationId) {
      // Same helper and therefore the same 403 the rest of the admin API uses;
      // the list must not answer 400 where every other branch route answers 403.
      await assertLocationAccess(req.admin!, locationId);
    }

    const filter = { status, q, location_id: locationId, location_ids: allowed ?? undefined };
    const [posts, total] = await Promise.all([
      getJobPosts({ ...filter, ...page }),
      countJobPosts(filter),
    ]);
    sendPaged(res, posts, total, page);
  },

/**
 * Everything the create and edit forms need to render their pickers: the
 * branches this admin may post to, and the job types already in use.
 *
 * The branch list is served from here rather than from `/admin/locations`,
 * because that route is gated on tabs like `orders` and `branches`. A manager
 * whose account was saved with only the Jobs tab would get a 403 there, leaving
 * the form with no branches and no way to save a post.
 *
 * Declared before `/:id` in the router so it is not read as an id.
 */
async fieldValues(req: Request, res: Response) {
  const allowed = await getAccessibleLocationIds(req.admin!);
  const [branches, types] = await Promise.all([
    getLocations({ allowedIds: allowed, activeOnly: true }),
    getJobPostTypes({ location_ids: allowed ?? undefined }),
  ]);
  sendSuccess(res, {
    branches: branches.map((branch) => ({ id: branch.id, name: branch.name })),
    types,
  });
},

  async getById(req: Request, res: Response) {
    const post = await assertJobPostAccess(req.admin!, req.params.id as string);
    sendSuccess(res, post);
  },

  async create(req: Request, res: Response) {
    const branchId = await resolveBranchId(req);
    const post = await createJobPost({
      ...req.body,
      location_id: branchId,
      location: await resolveJobPostLocation(branchId),
    });
    sendSuccess(res, post, 201);
  },

  async update(req: Request, res: Response) {
    const existing = await assertJobPostAccess(req.admin!, req.params.id as string);
    const movesBranch =
      typeof req.body.location_id === "string" && req.body.location_id !== existing.location_id;

    // The branch is only re-resolved when the request actually moves the post. A
    // branch manager editing their own post cannot retarget it at another branch,
    // and a body that simply omits the field cannot block the save.
    const data: Record<string, unknown> = { ...req.body, location: undefined, location_id: undefined };
    delete data.location;
    delete data.location_id;

    if (movesBranch) {
      const branchId = await resolveBranchId(req);
      data.location_id = branchId;
      // Never taken from the body; always a copy of the resolved branch name.
      data.location = await resolveJobPostLocation(branchId);
    }

    const post = await updateJobPost(req.params.id as string, data);
    sendSuccess(res, post);
  },

  async updateStatus(req: Request, res: Response) {
    await assertJobPostAccess(req.admin!, req.params.id as string);
    const { status } = req.body;
    const updated = await updateJobPost(req.params.id as string, { status });
    sendSuccess(res, updated);
  },

  async remove(req: Request, res: Response) {
    await assertJobPostAccess(req.admin!, req.params.id as string);
    await deleteJobPost(req.params.id as string);
    sendSuccess(res, { deleted: true });
  },
};

/**
 * Decides which branch a write applies to and checks the caller may use it.
 *
 * A super admin names the branch. Anyone branch-scoped must name one too, but it
 * is verified against their own assignments, so a forged id in the body is
 * rejected instead of creating a post in a branch they do not manage.
 */
async function resolveBranchId(req: Request): Promise<string> {
  const requested = typeof req.body.location_id === "string" ? req.body.location_id.trim() : "";
  if (!requested) {
    throw new BadRequestException("Choose a branch for this job post");
  }
  // No-ops for a super admin, rejects a branch-scoped caller naming a branch
  // that is not in their own assignments.
  await assertLocationAccess(req.admin!, requested);
  return requested;
}
