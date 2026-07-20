import type { Response } from "express";
import type { ApiResponse } from "../types/responses.js";

export function sendSuccess<T>(res: Response, data?: T, status = 200) {
  const body: ApiResponse<T> = { success: true, data };
  res.status(status).json(body);
}

export function sendError(res: Response, error: string, status = 400) {
  const body: ApiResponse = { success: false, error };
  res.status(status).json(body);
}
