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
