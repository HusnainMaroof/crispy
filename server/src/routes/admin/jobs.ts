import { Router } from "express";
import {
  getJobPosts,
  getJobPostById,
  createJobPost,
  updateJobPost,
  deleteJobPost,
} from "../../services/admin.service.js";
import { validate } from "../../middleware/validate.js";
import { jobPostSchema, jobPostUpdateSchema } from "../../validators/admin.schema.js";
import { sendSuccess, sendError } from "../../utils/response.js";

const router = Router();

router.get("/", async (req, res) => {
  try {
    const status = req.query.status as string | undefined;
    const posts = await getJobPosts({ status });
    sendSuccess(res, posts);
  } catch (e) {
    sendError(res, e instanceof Error ? e.message : "Unknown error");
  }
});

router.get("/:id", async (req, res) => {
  try {
    const post = await getJobPostById(req.params.id as string);
    sendSuccess(res, post);
  } catch (e) {
    sendError(res, e instanceof Error ? e.message : "Unknown error", 404);
  }
});

router.post("/", validate(jobPostSchema), async (req, res) => {
  try {
    const post = await createJobPost(req.body);
    sendSuccess(res, post, 201);
  } catch (e) {
    sendError(res, e instanceof Error ? e.message : "Unknown error", 400);
  }
});

router.put("/:id", validate(jobPostUpdateSchema), async (req, res) => {
  try {
    const post = await updateJobPost(req.params.id as string, req.body);
    sendSuccess(res, post);
  } catch (e) {
    sendError(res, e instanceof Error ? e.message : "Unknown error", 400);
  }
});

router.patch("/:id/status", async (req, res) => {
  try {
    const post = await getJobPostById(req.params.id as string);
    const newStatus = post.status === "active" ? "closed" : "active";
    const updated = await updateJobPost(req.params.id as string, { status: newStatus });
    sendSuccess(res, updated);
  } catch (e) {
    sendError(res, e instanceof Error ? e.message : "Unknown error", 400);
  }
});

router.delete("/:id", async (req, res) => {
  try {
    await deleteJobPost(req.params.id as string);
    sendSuccess(res, null, 204);
  } catch (e) {
    sendError(res, e instanceof Error ? e.message : "Unknown error", 400);
  }
});

export default router;
