import { z } from "zod";
import { DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE } from "../utils/pagination.js";

/**
 * Coerces a query string to an integer. `z.coerce.number()` alone turns "" into
 * 0 and "abc" into NaN, both of which would produce a nonsense offset. The
 * bound is applied to the inner number schema, before the preprocess wrapper,
 * because the wrapper itself carries no validators.
 */
function pageInt(fallback: number, max?: number) {
  const base = z
    .number({ invalid_type_error: "Expected a number" })
    .int("Expected a whole number")
    .min(1, "Must be 1 or more");
  const bounded = max ? base.max(max, `Must be ${max} or less`) : base;
  return z.preprocess(
    (value) => (value === undefined || value === "" || value === null ? fallback : Number(value)),
    bounded,
  );
}

export const paginationSchema = z.object({
  page: pageInt(1),
  limit: pageInt(DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE),
});

/** Page and limit merged with a row-selection cap, for bounded reference data. */
export const cappedListSchema = z.object({
  limit: pageInt(DEFAULT_PAGE_SIZE, 500),
});

/** Free-text search shared by the customer and staff lists. */
export const searchTerm = z.string().trim().max(100).optional();

export const ORDER_STATUSES = [
  "pending",
  "preparing",
  "ready",
  "out-for-delivery",
  "delivered",
  "cancelled",
] as const;

export const FULFILMENTS = ["delivery", "collection"] as const;
