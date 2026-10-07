import { Router } from "express";
import multer from "multer";
import { validate } from "../middleware/validate.js";
import { cvUploadLimiter } from "../middleware/rate-limiter.js";
import { BadRequestException } from "../utils/app-error.js";
import { createOrderSchema, customerProfileSchema, orderLookupSchema } from "../validators/order.schema.js";
import { contactMessageSchema, jobApplicationPublicSchema } from "../validators/admin.schema.js";
import { asyncHandler } from "../utils/async-handler.js";
import { ActionsController } from "../controllers/store/actions.controller.js";
import { CustomerController } from "../controllers/store/customers.controller.js";

const router = Router();

/**
 * Public CV upload for job applications. PDF and Word only, 5 MB, held in
 * memory and compressed before it goes to storage (`compressCv`), so nothing
 * lands on disk. The filter rejects an unwanted type with a real error: the
 * admin `upload` instance silently drops the file instead, which for an
 * anonymous applicant would surface as a bare "No file provided".
 */
const cvUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowed = [
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ];
    if (!allowed.includes(file.mimetype)) {
      cb(new BadRequestException("CV must be a PDF or Word document"));
      return;
    }
    cb(null, true);
  },
});

router.post("/orders", validate(createOrderSchema), asyncHandler(ActionsController.createOrder));
router.get("/orders/mine", asyncHandler(ActionsController.myOrders));
router.post("/orders/lookup", validate(orderLookupSchema), asyncHandler(ActionsController.lookupOrder));
router.get("/orders/:id", asyncHandler(ActionsController.getOrder));
router.get("/customers/me", asyncHandler(CustomerController.me));
router.patch("/customers/me", validate(customerProfileSchema), asyncHandler(CustomerController.updateMe));
router.post("/contact", validate(contactMessageSchema), asyncHandler(ActionsController.contact));
router.post("/jobs/cv", cvUploadLimiter, cvUpload.single("file"), asyncHandler(ActionsController.uploadCv));
router.post("/jobs/:id/apply", validate(jobApplicationPublicSchema), asyncHandler(ActionsController.applyForJob));

export default router;
