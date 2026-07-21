import type { Request, Response, NextFunction } from "express";
import { MulterError } from "multer";
import { logger } from "./logger.js";
import { AppError } from "../utils/app-error.js";

export function errorHandler(err: Error, _req: Request, res: Response, _next: NextFunction) {
  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      success: false,
      error: err.message,
      code: err.errorCode,
    });
    return;
  }

  if (err instanceof MulterError) {
    const status = err.code === "LIMIT_FILE_SIZE" ? 413 : 400;
    res.status(status).json({
      success: false,
      error: err.message,
      code: `ERR_${err.code}`,
    });
    return;
  }

  logger.error({ err, name: err.name }, "Unhandled error");
  res.status(500).json({
    success: false,
    error: "Internal server error",
    code: "ERR_INTERNAL",
  });
}
