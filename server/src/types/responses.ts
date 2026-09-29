import type { AdminRole } from "../config/admin-roles.js";

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  code?: string;
}

export interface AuthPayload {
  sub: string;
  email: string;
  role: AdminRole;
  tabs?: string[];
}
