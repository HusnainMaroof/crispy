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

const router = Router();

router.post("/upload", requireRole("superadmin"), upload.single("file"), asyncHandler(UploadController.upload));
router.post("/upload-media", requireRole("superadmin"), requireTab("content"), uploadMedia.single("file"), asyncHandler(UploadController.upload));

export default router;
