import rateLimit from "express-rate-limit";
import { envConfig } from "../config/env.js";

export const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: envConfig.RATE_LIMIT.MAX,
  message: { success: false, error: "Too many requests, please try again later", code: "ERR_TOO_MANY" },
  standardHeaders: true,
  legacyHeaders: false,
});

export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { success: false, error: "Too many login attempts, please try again later", code: "ERR_TOO_MANY" },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true,
});

export const adminLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: envConfig.RATE_LIMIT.MAX,
  message: { success: false, error: "Too many requests, please try again later", code: "ERR_TOO_MANY" },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * Cart quoting and checkout get their own budgets. Both sit behind the global
 * per-IP cap, where a shared mobile carrier or office IP could exhaust 100
 * requests and lock out genuine customers mid-checkout. Still bounded, just
 * at a level that matches how often a single page legitimately calls them.
 */
export const quoteLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  message: { success: false, error: "Too many cart updates, please wait a moment", code: "ERR_TOO_MANY" },
  standardHeaders: true,
  legacyHeaders: false,
});

export const checkoutLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 60,
  message: { success: false, error: "Too many orders from this connection, please try again shortly", code: "ERR_TOO_MANY" },
  standardHeaders: true,
  legacyHeaders: false,
  // A retried checkout reuses the same checkout_key and returns the original
  // order rather than creating a second one, so it is not abuse.
  skipSuccessfulRequests: true,
});
