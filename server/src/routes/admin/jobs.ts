import { Router } from "express";
import { validate } from "../../middleware/validate.js";
import { requireRole } from "../../middleware/auth.js";
import { jobPostSchema, jobPostUpdateSchema, jobPostStatusSchema } from "../../validators/admin.schema.js";
import { asyncHandler } from "../../utils/async-handler.js";
import { JobsController } from "../../controllers/admin/jobs.controller.js";

const router = Router();

// Job posts are per-branch, so staff are not allowed to manage them at all.
// Branch managers are limited to their own branches inside the controller.
// Applied to the reads too, not just the writes, so the role rule does not depend
// on `posts` being absent from the staff tab ceiling.
const canManageJobs = requireRole("superadmin", "branch_manager");

// Declared before "/:id" so the literal path is not read as an id.
router.get("/field-values", canManageJobs, asyncHandler(JobsController.fieldValues));
router.get("/", canManageJobs, asyncHandler(JobsController.list));
router.get("/:id", canManageJobs, asyncHandler(JobsController.getById));
router.post("/", canManageJobs, validate(jobPostSchema), asyncHandler(JobsController.create));
router.put("/:id", canManageJobs, validate(jobPostUpdateSchema), asyncHandler(JobsController.update));
router.patch("/:id/status", canManageJobs, validate(jobPostStatusSchema), asyncHandler(JobsController.updateStatus));
router.delete("/:id", canManageJobs, asyncHandler(JobsController.remove));

export default router;
