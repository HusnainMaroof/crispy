import type { Request, Response } from "express";
import type { ApiResponse, PaginatedResponse } from "../types/responses.js";

export function sendSuccess<T>(res: Response, data?: T, status = 200) {
  const body: ApiResponse<T> = { success: true, data };
  res.status(status).json(body);
}

export function sendPaginated<T>(
  res: Response,
  data: T[],
  pagination: { page: number; limit: number; total: number },
) {
  const body: PaginatedResponse<T> = {
    success: true,
    data,
    pagination: {
      ...pagination,
      totalPages: Math.ceil(pagination.total / pagination.limit),
    },
  };
  res.status(200).json(body);
}

export function sendError(res: Response, error: string, status = 400) {
  const body: ApiResponse = { success: false, error };
  res.status(status).json(body);
}
