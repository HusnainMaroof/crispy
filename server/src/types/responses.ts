import type { AdminRole } from "../config/admin-roles.js";

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  code?: string;
}

/**
 * Sent as a sibling of `data`, never inside it, so a collection endpoint keeps
 * returning a bare array. Existing clients read `body.data` and ignore unknown
 * top-level keys, which is what lets pagination land without a breaking change.
 */
export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: PaginationMeta;
}

export interface AuthPayload {
  sub: string;
  email: string;
  role: AdminRole;
  tabs?: string[];
}
