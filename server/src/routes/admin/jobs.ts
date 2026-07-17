import { Router } from "express";
import { validate } from "../../middleware/validate.js";
import { jobPostSchema, jobPostUpdateSchema, jobPostStatusSchema } from "../../validators/admin.schema.js";
import { asyncHandler } from "../../utils/async-handler.js";
import { JobsController } from "../../controllers/admin/jobs.controller.js";

const router = Router();

router.get("/", asyncHandler(JobsController.list));
router.get("/:id", asyncHandler(JobsController.getById));
router.post("/", validate(jobPostSchema), asyncHandler(JobsController.create));
router.put("/:id", validate(jobPostUpdateSchema), asyncHandler(JobsController.update));
router.patch("/:id/status", validate(jobPostStatusSchema), asyncHandler(JobsController.updateStatus));
router.delete("/:id", asyncHandler(JobsController.remove));

export default router;
