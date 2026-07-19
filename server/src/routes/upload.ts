import { Router } from "express";
import multer from "multer";
import { asyncHandler } from "../utils/async-handler.js";
import { UploadController } from "../controllers/admin/upload.controller.js";

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } });

const router = Router();

router.post("/upload", upload.single("image"), asyncHandler(UploadController.upload));

export default router;
