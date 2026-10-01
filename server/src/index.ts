import express from "express";
import cors from "cors";
import helmet from "helmet";
import compression from "compression";
import cookieParser from "cookie-parser";
import { envConfig } from "./config/env.js";
import { httpLogger, logger } from "./middleware/logger.js";
import { globalLimiter, authLimiter, adminLimiter, quoteLimiter, checkoutLimiter } from "./middleware/rate-limiter.js";
import { identifyCustomer } from "./middleware/identify-customer.js";
import { errorHandler } from "./middleware/error-handler.js";
import routes from "./routes/index.js";

const app = express();
const { SERVER, CORS } = envConfig;

// Trust proxy for correct IP behind Next.js rewrites
app.set("trust proxy", 1);

// Security
app.use(helmet());
const corsOrigin =
  CORS.ORIGIN === "*" || SERVER.NODE_ENV === "development" ? true : CORS.ORIGIN;
app.use(cors({ origin: corsOrigin, credentials: true }));

// Performance
app.use(compression());

// Cookie parsing
app.use(cookieParser());

// Anonymous customer identification (cookie-based)
app.use(identifyCustomer);

// Body parsing. 10mb matched nothing this API accepts: the largest legitimate
// payload is a CMS section with a list of media links. Media goes through
// multer, not this parser.
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true, limit: "1mb" }));

// Structured logging
app.use(httpLogger);

// Health check (must be before rate limiter to exclude it)
app.get("/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// Global rate limiting (skip admin routes — they're auth-protected)
app.use((req, res, next) => {
  if (req.path.startsWith("/api/admin")) return next();
  // Public store reads are what the homepage and menu need. The global cap
  // was treating a normal page load as abuse and then the branch list 429'd.
  if (req.method === "GET" && req.path.startsWith("/api/store/")) return next();
  // Cart quoting and checkout were counted against the same per-IP budget as
  // contact forms. Both are small, idempotent reads/writes that a page can
  // legitimately repeat, and a shared mobile or office IP exhausting the cap
  // locked out real customers instead of abusers. They get their own, much
  // higher allowance instead.
  if (req.path === "/api/menu/quote") return quoteLimiter(req, res, next);
  if (req.path === "/api/orders") return checkoutLimiter(req, res, next);
  globalLimiter(req, res, next);
});

// Apply stricter rate limit to auth routes (before routes so it applies first)
app.use("/api/admin/auth", authLimiter);

// Admin rate limiter for all authenticated admin endpoints
app.use("/api/admin", adminLimiter);

// All routes
app.use("/api", routes);

// Unknown paths still get a response, so a missing route is not a hung request.
app.use((_req, res) => {
  res.status(404).json({
    success: false,
    error: "Not found",
    code: "ERR_NOT_FOUND",
  });
});

// Error handling (must be last)
app.use(errorHandler);

const server = app.listen(SERVER.PORT, () => {
  logger.info({ port: SERVER.PORT, env: SERVER.NODE_ENV }, "Server started");
});

server.on("error", (error: NodeJS.ErrnoException) => {
  if (error.code === "EADDRINUSE") {
    logger.error(
      { port: SERVER.PORT },
      `Port ${SERVER.PORT} is already in use. Another server is still running, so this process did not start.`,
    );
  } else {
    logger.error({ err: error }, "Server failed to start");
  }
  process.exit(1);
});

// Graceful shutdown
const shutdown = async (signal: string) => {
  logger.info({ signal }, "Shutting down");
  server.close(() => {
    logger.info("Server closed");
    process.exit(0);
  });
  setTimeout(() => {
    logger.error("Forced shutdown after timeout");
    process.exit(1);
  }, 10000).unref();
};

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));

export default app;
