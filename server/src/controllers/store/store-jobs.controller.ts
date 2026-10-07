import type { Request, Response } from "express";
import { getJobPosts, getJobPostById } from "../../services/admin.service.js";
import { NotFoundException } from "../../utils/app-error.js";
import { sendSuccess } from "../../utils/response.js";
import type { JobPost } from "../../types/models.js";

/**
 * The public shape of a job post.
 *
 * `status`, `applications` and `updated_at` are dropped. `status` is redundant
 * because only active posts reach this route, and `applications` is an internal
 * running total with no meaning to a visitor.
 *
 * `location_id` is kept even though it is an internal id. It is already exposed
 * by `GET /api/store/locations`, and the careers page needs it to filter the list
 * by branch without a round trip per selection.
 *
 * The `*_ar` fields travel with every row. The page picks per locale and falls
 * back to the English field, so shipping both is simpler than a locale
 * parameter on the route and keeps one cached response shared by both stores.
 */
function toPublicJobPost(post: JobPost) {
  return {
    id: post.id,
    title: post.title,
    title_ar: post.title_ar,
    location: post.location,
    location_id: post.location_id,
    type: post.type,
    salary: post.salary,
    description: post.description,
    description_ar: post.description_ar,
    requirements: post.requirements,
    requirements_ar: post.requirements_ar,
    created_at: post.created_at,
  };
}

export const StoreJobsController = {
  /**
   * Public list. Only `active` posts are visible, and `location_id` narrows to a
   * single branch for the careers page filter. An empty id is ignored rather than
   * rejected, so a stale bookmark still renders the full list.
   */
  async list(req: Request, res: Response) {
    const locationId = typeof req.query.location_id === "string" ? req.query.location_id : "";
    // Anonymous public list: lag-tolerant, so the replica and short cache are ok.
    const posts = await getJobPosts({
      status: "active",
      ...(locationId ? { location_id: locationId } : {}),
      // High cap so a public list cannot load an unbounded table. The response
      // stays a bare array. Nine branches will not approach this.
      skip: 0,
      limit: 500,
      read: true,
      cache: true,
    });
    sendSuccess(res, posts.map(toPublicJobPost));
  },

  async getById(req: Request, res: Response) {
    const post = await getJobPostById(req.params.id as string);
    // This route is anonymous, so a draft or closed post used to be readable by
    // anyone who guessed the id. The list already hides them; the detail now
    // agrees with it.
    if (post.status !== "active") throw new NotFoundException("Job post not found");
    sendSuccess(res, toPublicJobPost(post));
  },
};
