import { Router } from "express";
import { validate } from "../../middleware/validate.js";
import { requireRole } from "../../middleware/auth.js";
import { createStaffSchema, staffBranchesSchema, updateStaffSchema } from "../../validators/admin.schema.js";
import { asyncHandler } from "../../utils/async-handler.js";
import { StaffController } from "../../controllers/admin/staff.controller.js";

const router = Router();

router.get("/", asyncHandler(StaffController.list));
router.post("/", validate(createStaffSchema), asyncHandler(StaffController.create));
router.get("/:id", asyncHandler(StaffController.getById));
router.patch("/:id", validate(updateStaffSchema), asyncHandler(StaffController.update));
router.post("/:id/deactivate", asyncHandler(StaffController.deactivate));
router.post("/:id/activate", asyncHandler(StaffController.activate));
router.put("/:id/branches", validate(staffBranchesSchema), asyncHandler(StaffController.branches));
// Erasing a login is terminal, so unlike the other staff writes it is
// super admin only. Deactivate is the reversible option and stays open to
// managers.
router.delete("/:id", requireRole("superadmin"), asyncHandler(StaffController.remove));

export default router;
