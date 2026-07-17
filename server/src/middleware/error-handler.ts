import type { Request, Response, NextFunction } from "express";
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

  logger.error({ err, name: err.name }, "Unhandled error");
  res.status(500).json({
    success: false,
    error: "Internal server error",
    code: "ERR_INTERNAL",
  });
}
