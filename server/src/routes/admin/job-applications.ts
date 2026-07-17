import { Router } from "express";
import { validate } from "../../middleware/validate.js";
import { jobApplicationSchema, jobApplicationUpdateSchema, jobApplicationStatusSchema } from "../../validators/admin.schema.js";
import { asyncHandler } from "../../utils/async-handler.js";
import { JobApplicationsController } from "../../controllers/admin/job-applications.controller.js";

const router = Router();

router.get("/", asyncHandler(JobApplicationsController.list));
router.get("/:id", asyncHandler(JobApplicationsController.getById));
router.post("/", validate(jobApplicationSchema), asyncHandler(JobApplicationsController.create));
router.put("/:id", validate(jobApplicationUpdateSchema), asyncHandler(JobApplicationsController.update));
router.patch("/:id/status", validate(jobApplicationStatusSchema), asyncHandler(JobApplicationsController.updateStatus));
router.delete("/:id", asyncHandler(JobApplicationsController.remove));

export default router;
