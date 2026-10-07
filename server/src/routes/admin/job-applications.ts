import { Router } from "express";
import { validate } from "../../middleware/validate.js";
import { requireRole } from "../../middleware/auth.js";
import { jobApplicationSchema, jobApplicationUpdateSchema, jobApplicationStatusSchema } from "../../validators/admin.schema.js";
import { asyncHandler } from "../../utils/async-handler.js";
import { JobApplicationsController } from "../../controllers/admin/job-applications.controller.js";

const router = Router();

// Same rule as the job posts: reviewing candidates is branch-manager work.
const canReviewApplications = requireRole("superadmin", "branch_manager");

router.get("/", canReviewApplications, asyncHandler(JobApplicationsController.list));
router.get("/:id", canReviewApplications, asyncHandler(JobApplicationsController.getById));
router.post("/", canReviewApplications, validate(jobApplicationSchema), asyncHandler(JobApplicationsController.create));
router.put("/:id", canReviewApplications, validate(jobApplicationUpdateSchema), asyncHandler(JobApplicationsController.update));
router.patch("/:id/status", canReviewApplications, validate(jobApplicationStatusSchema), asyncHandler(JobApplicationsController.updateStatus));
router.delete("/:id", canReviewApplications, asyncHandler(JobApplicationsController.remove));

export default router;
