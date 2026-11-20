import { Router } from "express";
import { requireRole, requireTab } from "../middleware/auth.js";
import multer from "multer";
import { asyncHandler } from "../utils/async-handler.js";
import { UploadController } from "../controllers/admin/upload.controller.js";

export const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowed = ["image/jpeg", "image/png", "image/webp", "image/avif", "video/mp4", "video/webm", "video/quicktime"];
    cb(null, allowed.includes(file.mimetype));
  },
});

export const uploadMedia = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowed = ["image/jpeg", "image/png", "image/webp", "image/avif", "video/mp4", "video/webm", "video/quicktime"];
    cb(null, allowed.includes(file.mimetype));
  },
});

/** Brochure PDFs for the CMS. Up to 25 MB comes in, and it must be 10 MB or less after compression. */
export const uploadPdf = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 25 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    cb(null, file.mimetype === "application/pdf");
  },
});

const router = Router();

router.post("/upload", requireRole("superadmin"), upload.single("file"), asyncHandler(UploadController.upload));
router.post("/upload-media", requireRole("superadmin"), requireTab("content"), uploadMedia.single("file"), asyncHandler(UploadController.upload));
router.post("/upload-document", requireRole("superadmin"), requireTab("content"), uploadPdf.single("file"), asyncHandler(UploadController.uploadDocument));
router.post("/upload-document/open", requireRole("superadmin"), requireTab("content"), asyncHandler(UploadController.openDocument));

export default router;
