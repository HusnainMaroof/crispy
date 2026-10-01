import type { Request, Response, NextFunction } from "express";
import { MulterError } from "multer";
import { logger } from "./logger.js";
import { AppError, ItemUnavailableException } from "../utils/app-error.js";

export function errorHandler(err: Error, _req: Request, res: Response, next: NextFunction) {
  // The response is already on the wire. Writing to it again is the
  // ERR_HTTP_HEADERS_SENT crash, which kills the process rather than the
  // request, so hand off to Express to tear the socket down instead.
  if (res.headersSent) {
    next(err);
    return;
  }

  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      success: false,
      error: err.message,
      code: err.errorCode,
      ...(err instanceof ItemUnavailableException ? { item: err.item } : {}),
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
