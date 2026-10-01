import type { Response } from "express";
import type { PaginationMeta } from "../types/responses.js";

/**
 * Page sizes for the admin tables. 20 matches the existing client-side
 * `Pagination` component's own size, so wiring it to the server does not
 * change how many rows a page shows. The cap stops a single request from
 * pulling an entire growing table into memory.
 */
export const DEFAULT_PAGE_SIZE = 20;
export const MAX_PAGE_SIZE = 100;

export interface PageRequest {
  page: number;
  limit: number;
  skip: number;
}

/**
 * Clamps rather than rejects, so `?limit=99999` degrades to the maximum
 * instead of erroring.
 *
 * Values arrive as raw strings from the query string, so they are coerced here
 * and anything that is not a finite number falls back to the default. Without
 * that guard a junk value produced NaN, which propagated into the Prisma
 * `skip` and surfaced as a 500 on a malformed request.
 */
function toInt(value: unknown, fallback: number): number {
  if (value === undefined || value === null || value === "") return fallback;
  const parsed = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.trunc(parsed);
}

export function resolvePage(input?: { page?: unknown; limit?: unknown }): PageRequest {
  const limit = Math.min(MAX_PAGE_SIZE, Math.max(1, toInt(input?.limit, DEFAULT_PAGE_SIZE)));
  const page = Math.max(1, toInt(input?.page, 1));
  return { page, limit, skip: (page - 1) * limit };
}

/** Builds the sibling `pagination` object from an exact total. */
export function buildMeta(page: number, limit: number, total: number): PaginationMeta {
  const totalPages = total > 0 ? Math.ceil(total / limit) : 0;
  return {
    page,
    limit,
    total,
    totalPages,
    hasNextPage: page * limit < total,
    hasPreviousPage: page > 1,
  };
}

/**
 * Sends a collection plus its pagination metadata. `data` stays a bare array,
 * so every existing consumer of these endpoints keeps working untouched.
 */
export function sendPage<T>(res: Response, rows: T[], meta: PaginationMeta): void {
  const body = { success: true as const, data: rows, pagination: meta };
  res.status(200).json(body);
}

/** Convenience wrapper for the common case of `count` + page read together. */
export function sendPaged<T>(res: Response, rows: T[], total: number, request: PageRequest): void {
  sendPage(res, rows, buildMeta(request.page, request.limit, total));
}
