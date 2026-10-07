import express from "express";
import cors from "cors";
import helmet from "helmet";
import compression from "compression";
import cookieParser from "cookie-parser";
import { envConfig } from "./config/env.js";
import { httpLogger, logger } from "./middleware/logger.js";
import { globalLimiter, authLimiter, adminLimiter, quoteLimiter, checkoutLimiter } from "./middleware/rate-limiter.js";
import { identifyCustomer } from "./middleware/identify-customer.js";
import { disconnectPrisma, getPrisma } from "./config/prisma.js";
import { assertProductionConfig } from "./config/env.js";
import { errorHandler } from "./middleware/error-handler.js";
import { reportError } from "./utils/error-tracker.js";
import routes from "./routes/index.js";

assertProductionConfig();

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

app.get("/health/ready", async (_req, res) => {
  const timestamp = new Date().toISOString();
  try {
    await getPrisma().$queryRaw`SELECT 1`;
    res.json({ status: "ok", database: "ok", timestamp });
  } catch (err) {
    reportError(err, { path: "/health/ready" });
    res.status(503).json({ status: "unavailable", database: "down", timestamp });
  }
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

// Stricter rate limit for password guessing, on the login endpoint only.
// The session probes (/auth/me, /auth/refresh) are not login attempts: they
// fail with 401 on every signed-out visit, so budgeting them here locked
// guests out of the login page after a handful of visits (429 surfaced as a
// "could not reach the server" screen instead of the login form).
app.use("/api/admin/auth/login", authLimiter);

// Admin rate limiter for all authenticated admin endpoints
app.use("/api/admin", adminLimiter);

// Public HTTP caching. Only anonymous read-only GETs, and only the responses
// that cannot vary per user. Cookie-dependent reads (branch menu, deals, CMS
// locale) get `Vary: Cookie` so shared caches never serve one visitor's branch
// or language to another. Quotes, orders, customers, and admin are never cached.
const PUBLIC_MAX_AGE = "public, max-age=60, stale-while-revalidate=120";
const PUBLIC_COOKIE_MAX_AGE = "public, max-age=30, stale-while-revalidate=60";
app.use((req, res, next) => {
  if (req.method !== "GET") return next();
  const path = req.path;
  const cookieFree =
    path === "/api/menu/categories" ||
    path === "/api/menu/items" ||
    path === "/api/store/locations" ||
    /^\/api\/store\/locations\/[^/]+$/.test(path) ||
    path === "/api/store/settings" ||
    path === "/api/store/jobs";
  const cookieBound =
    path === "/api/menu/full" ||
    path === "/api/menu/deals" ||
    path === "/api/store/homepage" ||
    /^\/api\/store\/cms\/[^/]+$/.test(path);
  // identifyCustomer may have just issued crispy_customer_id. A shared cache
  // must not store that Set-Cookie, or the next visitor would be handed
  // someone else's guest id. private + no-store also covers the branch cookie
  // set by PATCH /api/store/location when that response is not a public GET.
  if (res.getHeader("Set-Cookie")) {
    res.setHeader("Cache-Control", "private, no-store");
    return next();
  }
  if (cookieFree) {
    res.setHeader("Cache-Control", PUBLIC_MAX_AGE);
  } else if (cookieBound) {
    res.append("Vary", "Cookie");
    res.setHeader("Cache-Control", PUBLIC_COOKIE_MAX_AGE);
  }
  next();
});

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

const server = app.listen(SERVER.PORT, "127.0.0.1", () => {
  logger.info({ port: SERVER.PORT, env: SERVER.NODE_ENV }, "Server started");
});

server.requestTimeout = 60_000;
server.headersTimeout = 65_000;

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
    // Close the pg pools so in-flight queries finish and the process can exit.
    void disconnectPrisma().finally(() => process.exit(0));
  });
  setTimeout(() => {
    logger.error("Forced shutdown after timeout");
    process.exit(1);
  }, 10000).unref();
};

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));
process.on("unhandledRejection", (reason) => {
  reportError(reason, { kind: "unhandledRejection" });
});
process.on("uncaughtException", (err) => {
  reportError(err, { kind: "uncaughtException" });
});

export default app;
