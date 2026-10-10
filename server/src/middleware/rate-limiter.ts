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

/**
 * A public CV upload writes several MB to Cloudinary per request, so it gets a
 * small budget of its own instead of spending the general per-IP cap that a
 * normal browse of the careers page also draws from.
 */
export const cvUploadLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { success: false, error: "Too many CV uploads from this connection, please try again shortly", code: "ERR_TOO_MANY" },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * Contact messages notify the team by email, so each one costs a send. A real
 * visitor sends one or two; five per quarter hour covers a retry or two.
 */
export const contactLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: { success: false, error: "Too many messages, please try again later", code: "ERR_TOO_MANY" },
  standardHeaders: true,
  legacyHeaders: false,
});

/** Brochure requests email a PDF link to any address given, so they are capped tightly too. */
export const brochureLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: { success: false, error: "Too many brochure requests, please try again later", code: "ERR_TOO_MANY" },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * Location resolve calls a geocoder, and route calls a routing service. Both are
 * paid or rate-limited upstreams, so each has its own budget.
 */
export const locationResolveLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 60,
  message: { success: false, error: "Too many location searches, please try again shortly", code: "ERR_TOO_MANY" },
  standardHeaders: true,
  legacyHeaders: false,
});

export const locationRouteLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 60,
  message: { success: false, error: "Too many route requests, please try again shortly", code: "ERR_TOO_MANY" },
  standardHeaders: true,
  legacyHeaders: false,
});

/** Each translation calls a paid external API, so it has its own budget. */
export const translateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 60,
  message: { success: false, error: "Too many translation requests, please try again later", code: "ERR_TOO_MANY" },
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
