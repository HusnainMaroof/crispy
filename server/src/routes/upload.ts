import { Router } from "express";
import multer from "multer";
import { asyncHandler } from "../utils/async-handler.js";
import { UploadController } from "../controllers/admin/upload.controller.js";

export const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowed = ["image/jpeg", "image/png", "image/webp", "image/avif"];
    cb(null, allowed.includes(file.mimetype));
  },
});

const router = Router();

router.post("/upload", upload.single("file"), asyncHandler(UploadController.upload));

export default router;
