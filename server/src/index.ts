import express from "express";
import cors from "cors";
import helmet from "helmet";
import compression from "compression";
import cookieParser from "cookie-parser";
import { envConfig } from "./config/env.js";
import { httpLogger, logger } from "./middleware/logger.js";
import { globalLimiter, authLimiter, adminLimiter } from "./middleware/rate-limiter.js";
import { identifyCustomer } from "./middleware/identify-customer.js";
import { errorHandler } from "./middleware/error-handler.js";
import routes from "./routes/index.js";

const app = express();
const { SERVER, CORS } = envConfig;

// Trust proxy for correct IP behind Next.js rewrites
app.set("trust proxy", 1);

// Security
app.use(helmet());
const corsOrigin = CORS.ORIGIN === "*" ? true : CORS.ORIGIN;
app.use(cors({ origin: corsOrigin, credentials: true }));

// Performance
app.use(compression());

// Cookie parsing
app.use(cookieParser());

// Anonymous customer identification (cookie-based)
app.use(identifyCustomer);

// Body parsing
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

// Structured logging
app.use(httpLogger);

// Health check (must be before rate limiter to exclude it)
app.get("/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// Global rate limiting (skip admin routes — they're auth-protected)
app.use((req, res, next) => {
  if (req.path.startsWith("/api/admin")) return next();
  globalLimiter(req, res, next);
});

// Apply stricter rate limit to auth routes (before routes so it applies first)
app.use("/api/admin/auth", authLimiter);

// Admin rate limiter for all authenticated admin endpoints
app.use("/api/admin", adminLimiter);

// All routes
app.use("/api", routes);

// Error handling (must be last)
app.use(errorHandler);

const server = app.listen(SERVER.PORT, () => {
  logger.info({ port: SERVER.PORT, env: SERVER.NODE_ENV }, "Server started");
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
